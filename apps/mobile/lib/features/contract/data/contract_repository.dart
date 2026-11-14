import '../../../core/utils/result.dart';
import '../domain/contract.dart';
import '../domain/contract_bid.dart';
import '../domain/contract_milestone.dart';
import '../domain/contract_project.dart';

abstract interface class ContractRepository {
  Future<Result<List<ContractProject>>> listMyProjects();
  Future<Result<List<ContractProject>>> listOpenProjects();
  Future<Result<ContractProject>> createProject({
    required String categoryId,
    required String title,
    required String description,
    int? budgetMin,
    int? budgetMax,
  });
  Future<Result<ContractProject>> fetchProjectById(String id);

  Future<Result<List<ContractBid>>> listBidsForProject(String projectId);
  Future<Result<List<ContractBid>>> listMyBids();
  Future<Result<ContractBid>> submitBid({required String projectId, required int amount, String? message});
  Future<Result<void>> withdrawBid(String bidId);
  Future<Result<Contract>> awardBid(String bidId);

  Future<Result<Contract>> fetchContractById(String id);
  Future<Result<List<ContractMilestone>>> listMilestones(String contractId);
  Future<Result<ContractMilestone>> createMilestone({required String contractId, required String title, required int amount});
}
