import 'package:hive_ce_flutter/hive_flutter.dart';

/// Schemaless key-value cache for safe, read-only, non-sensitive data
/// (categories, recent searches, last-known-good API responses, UI
/// preferences) — never authentication tokens (those live in
/// SecureTokenStorage) and never treated as authoritative: callers read
/// from here only to render instantly while a fresh network fetch is in
/// flight, and overwrite it once that fetch resolves.
abstract final class LocalCache {
  static const _boxName = 'sahl_cache';

  static Box? _box;

  static bool get isReady => _box != null;

  /// Called once in `main()` before first paint. Callers wrap it in
  /// try/catch — a cache-init failure degrades to "nothing cached".
  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  static T? get<T>(String key) => _box?.get(key) as T?;

  static Future<void> put(String key, Object? value) async {
    await _box?.put(key, value);
  }

  static Future<void> remove(String key) async {
    await _box?.delete(key);
  }

  static Future<void> clear() async {
    await _box?.clear();
  }
}
