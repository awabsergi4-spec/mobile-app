import 'home_layout_block.dart';

/// The client-side contract for docs/02-architecture.md ADR-007: the app is
/// a thin renderer of backend-driven config, not a hardcoded client. Backed
/// by `GET /api/v1/config` (docs/04-api-modules.md §2) once the HTTP client
/// layer exists — interface defined first, matching every other
/// cross-cutting concern in this codebase (domain/ai, PaymentProvider, ...).
abstract interface class RemoteConfigRepository {
  /// A single typed config value by RemoteConfigEntry.key, already resolved
  /// for the caller's region/targeting context server-side — the client
  /// never evaluates targetingRules itself.
  Future<T?> getValue<T>(String key);

  /// The published home screen layout, already filtered to blocks matching
  /// the caller's targeting context and publish window — ordered by
  /// position, ready to render.
  Future<List<HomeLayoutBlock>> getHomeLayout();

  /// Refreshes the local cache from the backend. Called on app start and
  /// on foreground resume — never blocks first paint: the app renders from
  /// the last cached config (Offline Support, docs/00-functional-requirements.md)
  /// and updates once this resolves.
  Future<void> refresh();
}
