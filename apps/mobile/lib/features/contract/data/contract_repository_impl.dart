import '../../../core/networking/api_call.dart';
import '../../../core/networking/api_client.dart';
import '../../../core/networking/app_failure_exception.dart';
import '../../../core/utils/result.dart';
import '../domain/contract.dart';
import '../domain/contract_bid.dart';
import '../domain/contract_milestone.dart';
import '../domain/contract_project.dart';
import 'contract_repository.dart';

class ContractRepositoryImpl implements ContractRepository {
  ContractRepositoryImpl({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  @override
  Future<Result<List<ContractProject>>> listMyProjects() async {
    try {
      final response = await _apiClient.get('/contracts/projects', queryParameters: {'mine': 'true'});
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ContractProject.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ContractProject>>> listOpenProjects() async {
    try {
      final response = await _apiClient.get('/contracts/projects');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ContractProject.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ContractProject>> createProject({
    required String categoryId,
    required String title,
    required String description,
    int? budgetMin,
    int? budgetMax,
  }) async {
    try {
      final response = await _apiClient.post(
        '/contracts/projects',
        data: {
          'categoryId': categoryId,
          'title': title,
          'description': description,
          if (budgetMin != null) 'budgetMin': budgetMin,
          if (budgetMax != null) 'budgetMax': budgetMax,
        },
      );
      return Result.success(ContractProject.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ContractProject>> fetchProjectById(String id) async {
    try {
      final response = await _apiClient.get('/contracts/projects/$id');
      return Result.success(ContractProject.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ContractBid>>> listBidsForProject(String projectId) async {
    try {
      final response = await _apiClient.get('/contracts/projects/$projectId/bids');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ContractBid.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ContractBid>>> listMyBids() async {
    try {
      final response = await _apiClient.get('/contracts/bids/me');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ContractBid.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ContractBid>> submitBid({required String projectId, required int amount, String? message}) async {
    try {
      final response = await _apiClient.post(
        '/contracts/projects/$projectId/bids',
        data: {'amount': amount, if (message != null && message.isNotEmpty) 'message': message},
      );
      return Result.success(ContractBid.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> withdrawBid(String bidId) async {
    try {
      await _apiClient.post('/contracts/bids/$bidId/withdraw');
      return const Result.success(null);
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<Contract>> awardBid(String bidId) async {
    try {
      final response = await _apiClient.post('/contracts/bids/$bidId/award');
      return Result.success(Contract.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<Contract>> fetchContractById(String id) async {
    try {
      final response = await _apiClient.get('/contracts/$id');
      return Result.success(Contract.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<List<ContractMilestone>>> listMilestones(String contractId) async {
    try {
      final response = await _apiClient.get('/contracts/$contractId/milestones');
      return Result.success(response.dataAsList.cast<Map<String, dynamic>>().map(ContractMilestone.fromJson).toList());
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<ContractMilestone>> createMilestone({required String contractId, required String title, required int amount}) async {
    try {
      final response = await _apiClient.post('/contracts/$contractId/milestones', data: {'title': title, 'amount': amount});
      return Result.success(ContractMilestone.fromJson(response.dataAsMap));
    } on AppFailureException catch (e) {
      return Result.failure(e.failure);
    }
  }

  @override
  Future<Result<void>> cancelProject(String projectId) => apiCall(() async {
        await _apiClient.post('/contracts/projects/$projectId/cancel');
      });

  @override
  Future<Result<ContractMilestone>> updateMilestoneStatus(String milestoneId, String toStatus) => apiCall(() async {
        final response = await _apiClient.post('/contracts/milestones/$milestoneId/status', data: {'toStatus': toStatus});
        return ContractMilestone.fromJson(response.dataAsMap);
      });
}
