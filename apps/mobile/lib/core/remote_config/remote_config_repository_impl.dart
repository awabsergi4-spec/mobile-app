import '../networking/api_client.dart';
import '../networking/app_failure_exception.dart';
import '../storage/local_cache.dart';
import 'home_layout_block.dart';
import 'remote_config_repository.dart';

class RemoteConfigRepositoryImpl implements RemoteConfigRepository {
  RemoteConfigRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient {
    _loadFromCache();
  }

  final ApiClient _apiClient;

  static const _valuesCacheKey = 'remote_config_values';
  static const _homeLayoutCacheKey = 'remote_config_home_layout';

  Map<String, dynamic> _values = const {};
  List<HomeLayoutBlock> _homeLayout = const [];

  void _loadFromCache() {
    final cachedValues = LocalCache.get<Map>(_valuesCacheKey);
    if (cachedValues != null) {
      _values = Map<String, dynamic>.from(cachedValues);
    }
    final cachedLayout = LocalCache.get<List>(_homeLayoutCacheKey);
    if (cachedLayout != null) {
      _homeLayout = cachedLayout.map((e) => HomeLayoutBlock.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
  }

  @override
  Future<T?> getValue<T>(String key) async {
    final entry = _values[key];
    if (entry is! Map) return null;
    return entry['value'] as T?;
  }

  @override
  Future<List<HomeLayoutBlock>> getHomeLayout() async => _homeLayout;

  @override
  Future<void> refresh() async {
    try {
      final configResponse = await _apiClient.get('/config');
      final layoutResponse = await _apiClient.get('/home-layout');

      final values = configResponse.dataAsMap;
      final rawBlocks = layoutResponse.dataAsList.cast<Map<String, dynamic>>();
      final blocks = rawBlocks
          .map(HomeLayoutBlock.fromJson)
          .where((block) => supportedHomeBlockTypes.contains(block.type))
          .toList()
        ..sort((a, b) => a.position.compareTo(b.position));

      _values = values;
      _homeLayout = blocks;

      await LocalCache.put(_valuesCacheKey, values);
      await LocalCache.put(_homeLayoutCacheKey, rawBlocks);
    } on AppFailureException {
      // Offline-tolerant by design (see RemoteConfigRepository.refresh doc
      // comment) — keep whatever's already cached/in-memory rather than
      // surfacing a failure the caller would have to handle.
    }
  }
}
