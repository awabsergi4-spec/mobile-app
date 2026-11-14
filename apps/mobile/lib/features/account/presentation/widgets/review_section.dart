import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/errors/failure_localizer.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/result.dart';
import '../../../../shared/widgets/error_banner.dart';
import '../../../../shared/widgets/sahl_ui.dart';
import '../../application/account_providers.dart';
import '../../domain/account_models.dart';

/// "Rate this service" for a completed job: shows the customer's review if
/// they've left one, otherwise a button that opens the review sheet.
class ReviewSection extends ConsumerWidget {
  const ReviewSection({super.key, required this.type, required this.jobId});

  final ReviewJobType type;
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final key = (type: type, jobId: jobId);
    final review = ref.watch(myReviewForJobProvider(key));
    return review.when(
      loading: () => const SkeletonBox(height: 56),
      error: (_, _) => const SizedBox.shrink(),
      data: (r) {
        if (r != null) {
          return SahlCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.yourRating, style: TextStyle(color: context.sahl.textMuted, fontSize: 12)),
                const SizedBox(height: AppSpacing.xs),
                RatingStars(rating: r.rating.toDouble(), size: 20),
                if (r.comment != null && r.comment!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(r.comment!),
                ],
              ],
            ),
          );
        }
        return FilledButton.tonalIcon(
          icon: const Icon(Symbols.star),
          label: Text(l10n.rateService),
          onPressed: () async {
            final done = await showModalBottomSheet<bool>(
              context: context,
              isScrollControlled: true,
              showDragHandle: true,
              builder: (_) => _ReviewSheet(type: type, jobId: jobId),
            );
            if (done == true) {
              ref.invalidate(myReviewForJobProvider(key));
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.reviewThanks)));
              }
            }
          },
        );
      },
    );
  }
}

class _ReviewSheet extends ConsumerStatefulWidget {
  const _ReviewSheet({required this.type, required this.jobId});

  final ReviewJobType type;
  final String jobId;

  @override
  ConsumerState<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends ConsumerState<_ReviewSheet> {
  int _rating = 0;
  final _comment = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting || _rating == 0) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _submitting = true;
      _error = null;
    });
    final result = await ref
        .read(accountRepositoryProvider)
        .submitReview(type: widget.type, jobId: widget.jobId, rating: _rating, comment: _comment.text);
    if (!mounted) return;
    switch (result) {
      case Success():
        Navigator.of(context).pop(true);
      case Failure(:final failure):
        setState(() {
          _submitting = false;
          _error = localizeFailure(l10n, failure);
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final accent = context.sahl.accent;
    return Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(l10n.reviewTitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: AppSpacing.base),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  iconSize: 40,
                  tooltip: '$i',
                  onPressed: () => setState(() => _rating = i),
                  icon: Icon(Symbols.star, fill: i <= _rating ? 1 : 0, color: i <= _rating ? accent : context.sahl.textMuted),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _comment,
            minLines: 3,
            maxLines: 6,
            maxLength: 1000,
            decoration: InputDecoration(hintText: l10n.reviewCommentHint),
          ),
          if (_error != null) ...[ErrorBanner(message: _error!), const SizedBox(height: AppSpacing.md)],
          FilledButton(
            onPressed: _rating == 0 || _submitting ? null : _submit,
            child: _submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(l10n.reviewSubmit),
          ),
        ],
      ),
    );
  }
}
