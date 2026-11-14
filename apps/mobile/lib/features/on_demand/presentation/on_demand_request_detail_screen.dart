import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../application/on_demand_controller.dart';
import '../domain/on_demand_request.dart';
import 'widgets/on_demand_status_label.dart';

class OnDemandRequestDetailScreen extends ConsumerWidget {
  const OnDemandRequestDetailScreen({super.key, required this.requestId});

  final String requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final request = ref.watch(onDemandRequestDetailProvider(requestId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onDemandRequestDetailsTitle)),
      body: AsyncValueView<OnDemandRequest>(
        value: request,
        onRetry: () => ref.invalidate(onDemandRequestDetailProvider(requestId)),
        data: (context, data) => _RequestDetailBody(request: data),
      ),
    );
  }
}

class _RequestDetailBody extends ConsumerWidget {
  const _RequestDetailBody({required this.request});

  final OnDemandRequest request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        Row(
          children: [
            Chip(
              label: Text(onDemandStatusText(l10n, request.status)),
              backgroundColor: onDemandStatusColor(context, request.status).withValues(alpha: 0.15),
              labelStyle: TextStyle(color: onDemandStatusColor(context, request.status)),
              side: BorderSide.none,
            ),
            if (request.isEmergency) ...[
              const SizedBox(width: AppSpacing.sm),
              Chip(
                label: Text(l10n.onDemandEmergencyBadge),
                backgroundColor: Theme.of(context).colorScheme.errorContainer,
                labelStyle: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                side: BorderSide.none,
              ),
            ],
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Text(request.description, style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: AppSpacing.xxl),
        if (request.status.isActive)
          OutlinedButton(
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(l10n.onDemandCancelConfirmTitle),
                  content: Text(l10n.onDemandCancelConfirmBody),
                  actions: [
                    TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(l10n.back)),
                    TextButton(onPressed: () => Navigator.of(context).pop(true), child: Text(l10n.confirm)),
                  ],
                ),
              );
              if (confirmed != true) return;
              final result = await ref.read(myOnDemandRequestsControllerProvider.notifier).cancel(request.id);
              if (result.isSuccess) {
                ref.invalidate(onDemandRequestDetailProvider(request.id));
              }
            },
            child: Text(l10n.onDemandCancelRequest),
          ),
      ],
    );
  }
}
