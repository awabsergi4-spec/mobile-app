import '../../../core/utils/result.dart';
import '../domain/service_category.dart';

abstract interface class ServiceCategoryRepository {
  Future<Result<List<ServiceCategory>>> listActive(ServiceType type, String locale);
}
