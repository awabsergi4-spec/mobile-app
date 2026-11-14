import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/contract_controller.dart';
import '../domain/contract_project.dart';
import 'widgets/contract_status_label.dart';

class MyContractProjectsScreen extends ConsumerWidget {
  const MyContractProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final projects = ref.watch(myContractProjectsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contractMyProjects)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/contracts/new'),
        icon: const Icon(Icons.add),
        label: Text(l10n.contractNewProject),
      ),
      body: AsyncValueView<List<ContractProject>>(
        value: projects,
        onRetry: () => ref.invalidate(myContractProjectsControllerProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.contractNoProjects);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myContractProjectsControllerProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.base),
              itemCount: data.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final project = data[index];
                return Card(
                  child: ListTile(
                    onTap: () => context.push('/contracts/projects/${project.id}'),
                    title: Text(project.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(project.description, maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: Chip(
                      label: Text(contractProjectStatusText(l10n, project.status)),
                      backgroundColor: contractProjectStatusColor(context, project.status).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: contractProjectStatusColor(context, project.status)),
                      side: BorderSide.none,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
