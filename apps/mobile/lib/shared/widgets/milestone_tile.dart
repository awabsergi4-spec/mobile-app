import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/errors/failure_localizer.dart';
import '../../core/l10n/generated/app_localizations.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/result.dart';
import '../utils/formatters.dart';
import 'sahl_ui.dart';

/// A contract/remote milestone with the next step the viewer may take:
/// the provider starts and submits work, the customer approves it
/// (PAID only follows the escrow release). [status] is the wire value
/// (`PENDING`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `PAID`).
class MilestoneTile extends StatefulWidget {
  const MilestoneTile({
    super.key,
    required this.title,
    required this.amount,
    required this.status,
    required this.isCustomer,
    required this.onChangeStatus,
    this.onDispute,
  });

  final String title;
  final int amount;
  final String status;
  final bool isCustomer;
  final Future<Result<Object?>> Function(String toStatus) onChangeStatus;
  final VoidCallback? onDispute;

  @override
  State<MilestoneTile> createState() => _MilestoneTileState();
}

class _MilestoneTileState extends State<MilestoneTile> {
  bool _busy = false;

  (String, StatusTone) _statusLabel(AppLocalizations l10n) => switch (widget.status) {
        'IN_PROGRESS' => (l10n.milestoneStatusInProgress, StatusTone.info),
        'SUBMITTED' => (l10n.milestoneStatusSubmitted, StatusTone.warning),
        'APPROVED' => (l10n.milestoneStatusApproved, StatusTone.success),
        'PAID' => (l10n.milestoneStatusPaid, StatusTone.success),
        _ => (l10n.milestoneStatusPending, StatusTone.neutral),
      };

  /// (label, target status, needs confirmation) or null when no action.
  (String, String, bool)? _action(AppLocalizations l10n) {
    if (widget.isCustomer) {
      return widget.status == 'SUBMITTED' ? (l10n.milestoneApprove, 'APPROVED', true) : null;
    }
    return switch (widget.status) {
      'PENDING' => (l10n.milestoneStart, 'IN_PROGRESS', false),
      'IN_PROGRESS' => (l10n.milestoneSubmit, 'SUBMITTED', false),
      _ => null,
    };
  }

  Future<void> _run(String toStatus, bool confirm) async {
    final l10n = AppLocalizations.of(context)!;
    if (confirm) {
      final ok = await showConfirmDialog(
        context,
        title: l10n.milestoneApproveConfirm,
        message: l10n.milestoneApproveMessage,
        confirmLabel: l10n.milestoneApprove,
      );
      if (!ok || !mounted) return;
    }
    setState(() => _busy = true);
    final result = await widget.onChangeStatus(toStatus);
    if (!mounted) return;
    setState(() => _busy = false);
    if (result case Failure(:final failure)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final (label, tone) = _statusLabel(l10n);
    final action = _action(l10n);
    return SahlCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(widget.title, style: const TextStyle(fontWeight: FontWeight.w700))),
              Text(Fmt.number(context, widget.amount), style: const TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              StatusChip(label: label, tone: tone),
              const Spacer(),
              if (widget.onDispute != null)
                IconButton(
                  icon: const Icon(Symbols.flag),
                  tooltip: l10n.disputeOpenAction,
                  onPressed: widget.onDispute,
                ),
              if (action != null)
                FilledButton.tonal(
                  onPressed: _busy ? null : () => _run(action.$2, action.$3),
                  child: _busy
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(action.$1),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
