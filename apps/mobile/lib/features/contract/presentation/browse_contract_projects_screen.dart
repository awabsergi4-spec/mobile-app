import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../application/contract_controller.dart';
import '../domain/contract_project.dart';

class BrowseContractProjectsScreen extends ConsumerWidget {
  const BrowseContractProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final projects = ref.watch(openContractProjectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.contractBrowseProjects),
        actions: [
          IconButton(
            icon: const Icon(Icons.list_alt),
            tooltip: l10n.contractMyBids,
            onPressed: () => context.push('/contracts/my-bids'),
          ),
        ],
      ),
      body: AsyncValueView<List<ContractProject>>(
        value: projects,
        onRetry: () => ref.invalidate(openContractProjectsProvider),
        data: (context, data) {
          if (data.isEmpty) {
            return EmptyStateView(message: l10n.contractNoOpenProjects);
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(openContractProjectsProvider),
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
                    subtitle: Text(project.description, maxLines: 2, overflow: TextOverflow.ellipsis),
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
