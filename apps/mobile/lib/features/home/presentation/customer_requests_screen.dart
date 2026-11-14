import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../contract/application/contract_controller.dart';
import '../../contract/domain/contract_project.dart';
import '../../contract/presentation/widgets/contract_status_label.dart';
import '../../on_demand/application/on_demand_controller.dart';
import '../../on_demand/domain/on_demand_request.dart';
import '../../on_demand/presentation/widgets/on_demand_status_label.dart';
import '../../remote/application/remote_controller.dart';
import '../../remote/domain/remote_engagement.dart';
import '../../remote/presentation/widgets/remote_status_label.dart';

enum _Kind { onDemand, shortTerm, longTerm }

enum _Bucket { all, pending, accepted, inProgress, completed, cancelled }

/// Customer › My Requests tab: every request across the three service
/// types, filtered by status bucket.
class CustomerRequestsScreen extends ConsumerStatefulWidget {
  const CustomerRequestsScreen({super.key});

  @override
  ConsumerState<CustomerRequestsScreen> createState() => _CustomerRequestsScreenState();
}

class _CustomerRequestsScreenState extends ConsumerState<CustomerRequestsScreen> {
  _Kind _kind = _Kind.onDemand;
  _Bucket _bucket = _Bucket.all;

  /// Buckets that can contain anything for each kind.
  static const _bucketsByKind = {
    _Kind.onDemand: [_Bucket.all, _Bucket.pending, _Bucket.accepted, _Bucket.inProgress, _Bucket.completed, _Bucket.cancelled],
    _Kind.shortTerm: [_Bucket.all, _Bucket.inProgress, _Bucket.completed, _Bucket.cancelled],
    _Kind.longTerm: [_Bucket.all, _Bucket.pending, _Bucket.accepted, _Bucket.cancelled],
  };

  String _bucketLabel(AppLocalizations l10n, _Bucket b) => switch (b) {
        _Bucket.all => l10n.requestsBucketAll,
        _Bucket.pending => l10n.requestsBucketPending,
        _Bucket.accepted => l10n.requestsBucketAccepted,
        _Bucket.inProgress => l10n.requestsBucketInProgress,
        _Bucket.completed => l10n.requestsBucketCompleted,
        _Bucket.cancelled => l10n.requestsBucketCancelled,
      };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.requestsTitle),
        actions: [
          IconButton(tooltip: l10n.disputeMyDisputes, icon: const Icon(Symbols.report), onPressed: () => context.push('/disputes')),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.sm, AppSpacing.base, 0),
            child: SegmentedButton<_Kind>(
              showSelectedIcon: false,
              segments: [
                ButtonSegment(value: _Kind.onDemand, label: Text(l10n.serviceTypeOnDemand, maxLines: 1)),
                ButtonSegment(value: _Kind.shortTerm, label: Text(l10n.serviceTypeShortTerm, maxLines: 1)),
                ButtonSegment(value: _Kind.longTerm, label: Text(l10n.serviceTypeLongTerm, maxLines: 1)),
              ],
              selected: {_kind},
              onSelectionChanged: (s) => setState(() {
                _kind = s.first;
                if (!_bucketsByKind[_kind]!.contains(_bucket)) _bucket = _Bucket.all;
              }),
            ),
          ),
          SizedBox(
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: AppSpacing.sm),
              children: [
                for (final b in _bucketsByKind[_kind]!)
                  Padding(
                    padding: const EdgeInsetsDirectional.only(end: AppSpacing.sm),
                    child: ChoiceChip(label: Text(_bucketLabel(l10n, b)), selected: _bucket == b, onSelected: (_) => setState(() => _bucket = b)),
                  ),
              ],
            ),
          ),
          Expanded(
            child: switch (_kind) {
              _Kind.onDemand => _OnDemandList(bucket: _bucket),
              _Kind.shortTerm => _RemoteList(bucket: _bucket),
              _Kind.longTerm => _ProjectList(bucket: _bucket),
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => switch (_kind) {
          _Kind.onDemand => context.push('/book'),
          _Kind.shortTerm => context.go('/c/explore?type=remote'),
          _Kind.longTerm => context.push('/contracts/new'),
        },
        icon: const Icon(Symbols.add),
        label: Text(switch (_kind) {
          _Kind.onDemand => l10n.onDemandNewRequest,
          _Kind.shortTerm => l10n.remoteNewEngagement,
          _Kind.longTerm => l10n.postProjectAction,
        }),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.statusLabel,
    required this.statusColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String statusLabel;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SahlCard(
      onTap: onTap,
      child: Row(
        children: [
          IconBadge(icon: icon, color: statusColor),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(color: context.sahl.textMuted, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
            child: Text(statusLabel, style: TextStyle(color: statusColor, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

Widget _list<T>(BuildContext context, List<T> items, Future<void> Function() onRefresh, Widget Function(T) build) {
  final l10n = AppLocalizations.of(context)!;
  return RefreshIndicator(
    onRefresh: onRefresh,
    child: items.isEmpty
        ? ListView(children: [const SizedBox(height: 60), EmptyStateView(icon: Symbols.receipt_long, message: l10n.requestsEmpty)])
        : ListView.separated(
            padding: const EdgeInsets.fromLTRB(AppSpacing.base, 0, AppSpacing.base, 96),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
            itemBuilder: (_, i) => build(items[i]),
          ),
  );
}

class _OnDemandList extends ConsumerWidget {
  const _OnDemandList({required this.bucket});

  final _Bucket bucket;

  bool _matches(OnDemandStatus s) => switch (bucket) {
        _Bucket.all => true,
        _Bucket.pending => s == OnDemandStatus.searching,
        _Bucket.accepted => s == OnDemandStatus.assigned || s == OnDemandStatus.enRoute,
        _Bucket.inProgress => s == OnDemandStatus.inProgress,
        _Bucket.completed => s == OnDemandStatus.completed,
        _Bucket.cancelled => s == OnDemandStatus.cancelled,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final value = ref.watch(myOnDemandRequestsControllerProvider);
    return AsyncValueView<List<OnDemandRequest>>(
      value: value,
      loading: const SkeletonList(),
      onRetry: () => ref.invalidate(myOnDemandRequestsControllerProvider),
      data: (context, all) {
        final items = all.where((r) => _matches(r.status)).toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return _list<OnDemandRequest>(
          context,
          items,
          () async => ref.invalidate(myOnDemandRequestsControllerProvider),
          (r) => _RequestCard(
            icon: r.isEmergency ? Symbols.emergency : Symbols.bolt,
            title: r.description,
            subtitle: r.scheduledFor != null
                ? l10n.scheduledFor(Fmt.dateTime(context, r.scheduledFor!))
                : l10n.requestedOn(Fmt.dateTime(context, r.createdAt)),
            statusLabel: onDemandStatusText(l10n, r.status),
            statusColor: onDemandStatusColor(context, r.status),
            onTap: () => context.push('/on-demand/${r.id}'),
          ),
        );
      },
    );
  }
}

class _RemoteList extends ConsumerWidget {
  const _RemoteList({required this.bucket});

  final _Bucket bucket;

  bool _matches(RemoteEngagementStatus s) => switch (bucket) {
        _Bucket.all => true,
        _Bucket.inProgress => s == RemoteEngagementStatus.active || s == RemoteEngagementStatus.delivered,
        _Bucket.completed => s == RemoteEngagementStatus.completed,
        _Bucket.cancelled => s == RemoteEngagementStatus.cancelled,
        _ => false,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final provider = myRemoteEngagementsControllerProvider(false);
    return AsyncValueView<List<RemoteEngagement>>(
      value: ref.watch(provider),
      loading: const SkeletonList(),
      onRetry: () => ref.invalidate(provider),
      data: (context, all) {
        final items = all.where((e) => _matches(e.status)).toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return _list<RemoteEngagement>(
          context,
          items,
          () async => ref.invalidate(provider),
          (e) => _RequestCard(
            icon: Symbols.laptop_mac,
            title: e.title,
            subtitle: '${Fmt.number(context, e.amount)} · ${Fmt.date(context, e.createdAt)}',
            statusLabel: remoteEngagementStatusText(l10n, e.status),
            statusColor: remoteEngagementStatusColor(context, e.status),
            onTap: () => context.push('/remote/${e.id}'),
          ),
        );
      },
    );
  }
}

class _ProjectList extends ConsumerWidget {
  const _ProjectList({required this.bucket});

  final _Bucket bucket;

  bool _matches(ContractProjectStatus s) => switch (bucket) {
        _Bucket.all => true,
        _Bucket.pending => s == ContractProjectStatus.openForBids,
        _Bucket.accepted => s == ContractProjectStatus.awarded,
        _Bucket.cancelled => s == ContractProjectStatus.cancelled,
        _ => false,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return AsyncValueView<List<ContractProject>>(
      value: ref.watch(myContractProjectsControllerProvider),
      loading: const SkeletonList(),
      onRetry: () => ref.invalidate(myContractProjectsControllerProvider),
      data: (context, all) {
        final items = all.where((p) => _matches(p.status)).toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return _list<ContractProject>(
          context,
          items,
          () async => ref.invalidate(myContractProjectsControllerProvider),
          (p) => _RequestCard(
            icon: Symbols.handshake,
            title: p.title,
            subtitle: (p.budgetMin != null || p.budgetMax != null)
                ? '${Fmt.priceRange(context, p.budgetMin, p.budgetMax)} · ${Fmt.date(context, p.createdAt)}'
                : Fmt.date(context, p.createdAt),
            statusLabel: contractProjectStatusText(l10n, p.status),
            statusColor: contractProjectStatusColor(context, p.status),
            onTap: () => context.push('/contracts/projects/${p.id}'),
          ),
        );
      },
    );
  }
}
