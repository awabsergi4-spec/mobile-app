import 'package:sahl_mobile/core/remote_config/home_layout_block.dart';
import 'package:sahl_mobile/core/remote_config/remote_config_repository.dart';

/// Scriptable in-memory RemoteConfigRepository — no real Dio call, matching
/// the FakeAuthRepository pattern (test/features/auth/fakes). Router/home
/// tests only need this to resolve instantly, never to exercise real
/// config content.
class FakeRemoteConfigRepository implements RemoteConfigRepository {
  List<HomeLayoutBlock> homeLayout = const [];
  Map<String, dynamic> values = const {};

  @override
  Future<T?> getValue<T>(String key) async => values[key] as T?;

  @override
  Future<List<HomeLayoutBlock>> getHomeLayout() async => homeLayout;

  @override
  Future<void> refresh() async {}
}
