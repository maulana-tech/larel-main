#![no_std]

use soroban_sdk::{
    contract, contractimpl, token, Address, Bytes, BytesN, Env, Vec,
};

// Interface for LaxStellPool
#[soroban_sdk::contractclient(name = "LaxStellPoolClient")]
pub trait LaxStellPoolInterface {
    fn withdraw(
        env: Env,
        proof: Bytes,
        public_inputs: Bytes,
        recipient: Address,
        amount: i128,
        asset: Address,
    ) -> Result<(), soroban_sdk::Val>;

    fn deposit(
        env: Env,
        from: Address,
        asset: Address,
        amount: i128,
        commitment: BytesN<32>,
    ) -> u32;
}

// Interface for SoroswapRouter
#[soroban_sdk::contractclient(name = "SoroswapRouterClient")]
pub trait SoroswapRouterInterface {
    fn swap_exact_tokens_for_tokens(
        env: Env,
        amount_in: i128,
        amount_out_min: i128,
        path: Vec<Address>,
        to: Address,
        deadline: u64,
    ) -> Vec<i128>;
}

// Interface for SoroswapFactory
#[soroban_sdk::contractclient(name = "SoroswapFactoryClient")]
pub trait SoroswapFactoryInterface {
    fn get_pair(env: Env, token_a: Address, token_b: Address) -> Address;
}

#[contract]
pub struct LaxStellSwapRouter;

#[contractimpl]
impl LaxStellSwapRouter {
    pub fn swap_shielded(
        e: Env,
        pool: Address,
        soroswap_router: Address,
        proof: Bytes,
        public_inputs: Bytes,
        amount_in: i128,
        token_in: Address,
        token_out: Address,
        amount_out_min: i128,
        path: Vec<Address>,
        deadline: u64,
        recipient_commitment: BytesN<32>,
        user_public_address: Address,
    ) -> i128 {
        // Step 1: Call pool.withdraw() to pull token_in from pool to this contract
        let pool_client = LaxStellPoolClient::new(&e, &pool);
        // The public inputs specify this contract as the recipient of the withdraw.
        pool_client.withdraw(&proof, &public_inputs, &e.current_contract_address(), &amount_in, &token_in);

        // Step 2: Query the pair address from the official Soroswap Factory
        let factory_address = Address::from_string(&soroban_sdk::String::from_str(&e, "CDP3HMUH6SMS3S7NPGNDJLULCOXXEPSHY4JKUKMBNQMATHDHWXRRJTBY"));
        let factory_client = SoroswapFactoryClient::new(&e, &factory_address);
        let pair = factory_client.get_pair(&token_in, &path.get(1).unwrap());

        // Step 3: Authorize Soroswap Router to transfer token_in to the pair
        use soroban_sdk::auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation};
        use soroban_sdk::Symbol;
        use soroban_sdk::IntoVal;

        e.authorize_as_current_contract(Vec::from_array(
            &e,
            [InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token_in.clone(),
                    fn_name: Symbol::new(&e, "transfer"),
                    args: Vec::from_array(
                        &e,
                        [
                            e.current_contract_address().into_val(&e),
                            pair.into_val(&e),
                            amount_in.into_val(&e),
                        ],
                    ),
                },
                sub_invocations: Vec::new(&e),
            })],
        ));

        // Step 4: Swap token_in for token_out on Soroswap
        let soroswap_client = SoroswapRouterClient::new(&e, &soroswap_router);
        let amounts_out = soroswap_client.swap_exact_tokens_for_tokens(
            &amount_in,
            &amount_out_min,
            &path,
            &e.current_contract_address(),
            &deadline,
        );

        let amount_out_actual = amounts_out.last().unwrap();

        // Step 5: Authorize LaxStellPool to pull token_out
        e.authorize_as_current_contract(Vec::from_array(
            &e,
            [InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: token_out.clone(),
                    fn_name: Symbol::new(&e, "transfer"),
                    args: Vec::from_array(
                        &e,
                        [
                            e.current_contract_address().into_val(&e),
                            pool.clone().into_val(&e),
                            amount_out_min.into_val(&e),
                        ],
                    ),
                },
                sub_invocations: Vec::new(&e),
            })],
        ));

        // Step 6: Deposit token_out back into the pool under user's commitment
        pool_client.deposit(&e.current_contract_address(), &token_out, &amount_out_min, &recipient_commitment);

        // Step 7: Refund any surplus to user's public address
        let surplus = amount_out_actual - amount_out_min;
        if surplus > 0 {
            let token_out_client = token::Client::new(&e, &token_out);
            token_out_client.transfer(&e.current_contract_address(), &user_public_address, &surplus);
        }

        amount_out_actual
    }
}
