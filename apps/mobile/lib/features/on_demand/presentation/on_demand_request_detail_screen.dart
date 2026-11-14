import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../account/domain/account_models.dart';
import '../../account/presentation/widgets/review_section.dart';
import '../application/on_demand_controller.dart';
import '../domain/on_demand_assignment.dart';
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
        loading: const SkeletonList(itemCount: 3),
        onRetry: () => ref.invalidate(onDemandRequestDetailProvider(requestId)),
        data: (context, data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(onDemandRequestDetailProvider(requestId));
            ref.invalidate(onDemandRequestAssignmentsProvider(requestId));
          },
          child: _RequestDetailBody(request: data),
        ),
      ),
    );
  }
}

class _RequestDetailBody extends ConsumerStatefulWidget {
  const _RequestDetailBody({required this.request});

  final OnDemandRequest request;

  @override
  ConsumerState<_RequestDetailBody> createState() => _RequestDetailBodyState();
}

class _RequestDetailBodyState extends ConsumerState<_RequestDetailBody> {
  bool _cancelling = false;

  Future<void> _cancel() async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showConfirmDialog(
      context,
      title: l10n.onDemandCancelConfirmTitle,
      message: l10n.onDemandCancelConfirmBody,
      confirmLabel: l10n.onDemandCancelRequest,
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    setState(() => _cancelling = true);
    final result = await ref.read(myOnDemandRequestsControllerProvider.notifier).cancel(widget.request.id);
    if (!mounted) return;
    setState(() => _cancelling = false);
    result.when(
      success: (_) => ref.invalidate(onDemandRequestDetailProvider(widget.request.id)),
      failure: (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, f)))),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final request = widget.request;
    final tokens = context.sahl;
    final color = onDemandStatusColor(context, request.status);
    final hasProvider = request.status != OnDemandStatus.searching && request.status != OnDemandStatus.cancelled;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.base),
      children: [
        SahlCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconBadge(icon: Symbols.bolt, color: color),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      onDemandStatusText(l10n, request.status),
                      style: TextStyle(color: color, fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ),
                  if (request.isEmergency) StatusChip(label: l10n.onDemandEmergencyBadge, tone: StatusTone.danger, icon: Symbols.emergency),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                request.scheduledFor != null
                    ? l10n.scheduledFor(Fmt.dateTime(context, request.scheduledFor!))
                    : l10n.requestedOn(Fmt.dateTime(context, request.createdAt)),
                style: TextStyle(color: tokens.textMuted),
              ),
            ],
          ),
        ),
        SectionHeader(title: l10n.onDemandDescription),
        SahlCard(child: Text(request.description, style: const TextStyle(height: 1.5))),
        if (hasProvider) _AssignedProvider(requestId: request.id),
        if (request.status == OnDemandStatus.completed) ...[
          const SizedBox(height: AppSpacing.lg),
          ReviewSection(type: ReviewJobType.onDemand, jobId: request.id),
        ],
        if (request.status.isActive) ...[
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
            onPressed: _cancelling ? null : _cancel,
            icon: _cancelling
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Symbols.cancel),
            label: Text(l10n.onDemandCancelRequest),
          ),
        ],
      ],
    );
  }
}

class _AssignedProvider extends ConsumerWidget {
  const _AssignedProvider({required this.requestId});

  final String requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final assignments = ref.watch(onDemandRequestAssignmentsProvider(requestId)).valueOrNull ?? const <OnDemandAssignment>[];
    final accepted = assignments.where((a) => a.status == AssignmentStatus.accepted).firstOrNull;
    if (accepted == null || accepted.providerBusinessName == null) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SectionHeader(title: l10n.assignedProvider),
        SahlCard(
          onTap: accepted.providerId == null ? null : () => context.push('/providers/${accepted.providerId}'),
          child: Row(
            children: [
              SahlAvatar(name: accepted.providerBusinessName!),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(accepted.providerBusinessName!, style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (accepted.providerRatingAverage != null) RatingStars(rating: accepted.providerRatingAverage!, size: 14),
                  ],
                ),
              ),
              if (accepted.quotedPrice != null) Text(Fmt.number(context, accepted.quotedPrice!), style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }
}
