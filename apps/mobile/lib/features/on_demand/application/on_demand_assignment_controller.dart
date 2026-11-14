import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/result.dart';
import '../domain/on_demand_assignment.dart';
import 'on_demand_controller.dart';

class MyAssignmentsController extends AsyncNotifier<List<OnDemandAssignment>> {
  @override
  Future<List<OnDemandAssignment>> build() async {
    final result = await ref.read(onDemandRepositoryProvider).listMyAssignments();
    return result.when(success: (assignments) => assignments, failure: (failure) => throw failure);
  }

  Future<Result<void>> accept(String assignmentId) async {
    final result = await ref.read(onDemandRepositoryProvider).acceptAssignment(assignmentId);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }

  Future<Result<void>> decline(String assignmentId) async {
    final result = await ref.read(onDemandRepositoryProvider).declineAssignment(assignmentId);
    if (result.isSuccess) {
      ref.invalidateSelf();
    }
    return result;
  }
}

final myAssignmentsControllerProvider = AsyncNotifierProvider<MyAssignmentsController, List<OnDemandAssignment>>(
  MyAssignmentsController.new,
);
