// Generic contract formalizing the state-machine pattern already used
// implicitly by every status enum in this codebase (OnDemandStatus,
// ContractStatus, EscrowStatus, WithdrawalStatus, SubscriptionStatus,
// DisputeStatus, ...). Existing entities are NOT required to implement
// this — it's adopted incrementally as each bounded context is next
// touched, so e.g. an admin UI can generically ask "what are my options
// from here" for any entity that has. See ADR-009.
export interface StateMachine<TStatus extends string> {
  canTransition(from: TStatus, to: TStatus): boolean;
  allowedTransitions(from: TStatus): TStatus[];
}
