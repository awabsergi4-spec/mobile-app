import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/service_category.dart';
import 'service_category_repository.dart';

class ServiceCategoryRepositoryImpl implements ServiceCategoryRepository {
  ServiceCategoryRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<ServiceCategory>>> listActive(ServiceType type, String locale) async {
    try {
      final response = await _apiClient.get(
        '/service-categories',
        queryParameters: {'type': type.wireValue, 'locale': locale},
      );
      final categories = response.dataAsList.cast<Map<String, dynamic>>().map(ServiceCategory.fromJson).toList();
      return Result.success(categories);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }
}
