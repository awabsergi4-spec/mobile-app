import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/l10n/generated/app_localizations.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_theme.dart';

/// SAHL shared UI kit — every role's screens build from these so cards,
/// tiles, chips, loaders and dialogs look identical and follow the theme.
/// Nothing here hardcodes a background or text color: everything comes from
/// `ColorScheme` or `SahlSemanticColors` (`context.sahl`).

/// Rounded card with the theme's border; optional tap.
class SahlCard extends StatelessWidget {
  const SahlCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(AppSpacing.base)});

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

/// Brand-gradient hero card (greeting / balance / summary headers).
class GradientCard extends StatelessWidget {
  const GradientCard({super.key, required this.child, this.padding = const EdgeInsets.all(AppSpacing.lg)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: tokens.brandGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: tokens.brandEnd.withValues(alpha: 0.28), blurRadius: 18, offset: const Offset(0, 8))],
      ),
      child: DefaultTextStyle.merge(
        style: const TextStyle(color: Colors.white),
        child: IconTheme.merge(data: const IconThemeData(color: Colors.white), child: Padding(padding: padding, child: child)),
      ),
    );
  }
}

/// Section title with an optional trailing action ("See all").
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.lg, bottom: AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          ),
          if (actionLabel != null && onAction != null) TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

/// Colored circular icon badge — the "attractive colorful icon" style.
class IconBadge extends StatelessWidget {
  const IconBadge({super.key, required this.icon, required this.color, this.size = 44});

  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(color: color.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(size * 0.32)),
      child: Icon(icon, color: color, size: size * 0.52, fill: 1),
    );
  }
}

/// Small metric tile: icon, value, label.
class StatTile extends StatelessWidget {
  const StatTile({super.key, required this.icon, required this.color, required this.value, required this.label, this.onTap});

  final IconData icon;
  final Color color;
  final String value;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return SahlCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBadge(icon: icon, color: color, size: 38),
          const SizedBox(height: AppSpacing.md),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: context.sahl.textMuted),
          ),
        ],
      ),
    );
  }
}

/// Navigation row: colored icon, title, optional subtitle, chevron.
class ActionTile extends StatelessWidget {
  const ActionTile({
    super.key,
    required this.icon,
    required this.color,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
    this.leading,
    this.destructive = false,
  });

  final IconData icon;

  /// Replaces the icon badge (e.g. a category thumbnail).
  final Widget? leading;
  final Color color;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: 2),
      leading: leading ?? IconBadge(icon: icon, color: destructive ? colorScheme.error : color, size: 40),
      title: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.w600, color: destructive ? colorScheme.error : null),
      ),
      subtitle: subtitle == null ? null : Text(subtitle!, style: TextStyle(color: context.sahl.textMuted)),
      trailing: trailing ??
          (onTap == null || destructive
              ? null
              : Icon(Icons.chevron_right_rounded, color: context.sahl.textMuted, textDirection: Directionality.of(context))),
    );
  }
}

/// Groups ActionTiles inside one card with dividers.
class ActionGroup extends StatelessWidget {
  const ActionGroup({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(indent: 72),
            children[i],
          ],
        ],
      ),
    );
  }
}

enum StatusTone { neutral, info, success, warning, danger, brand }

/// Pill-shaped status label.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.tone = StatusTone.neutral, this.icon});

  final String label;
  final StatusTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;
    final color = switch (tone) {
      StatusTone.neutral => tokens.textMuted,
      StatusTone.info => tokens.info,
      StatusTone.success => tokens.success,
      StatusTone.warning => tokens.warning,
      StatusTone.danger => colorScheme.error,
      StatusTone.brand => colorScheme.primary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.13), borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 14, color: color), const SizedBox(width: 4)],
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

/// Initials avatar (or network image when a URL is set).
class SahlAvatar extends StatelessWidget {
  const SahlAvatar({super.key, required this.name, this.imageUrl, this.size = 44});

  final String name;
  final String? imageUrl;
  final double size;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    return parts.take(2).map((p) => p.characters.first.toUpperCase()).join();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    return Semantics(
      label: name,
      image: true,
      child: Container(
        height: size,
        width: size,
        decoration: BoxDecoration(shape: BoxShape.circle, gradient: tokens.brandGradient),
        clipBehavior: Clip.antiAlias,
        alignment: Alignment.center,
        child: imageUrl != null && imageUrl!.isNotEmpty
            ? Image.network(imageUrl!, fit: BoxFit.cover, height: size, width: size,
                errorBuilder: (_, _, _) => _InitialsText(text: _initials, size: size))
            : _InitialsText(text: _initials, size: size),
      ),
    );
  }
}

class _InitialsText extends StatelessWidget {
  const _InitialsText({required this.text, required this.size});

  final String text;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: size * 0.38));
  }
}

/// Read-only search bar that opens a search/explore screen when tapped.
class SearchBarButton extends StatelessWidget {
  const SearchBarButton({super.key, required this.hint, required this.onTap});

  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    return Semantics(
      button: true,
      label: hint,
      child: Material(
        color: Theme.of(context).colorScheme.surfaceContainer,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: tokens.border)),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.base, vertical: 14),
            child: Row(
              children: [
                Icon(Symbols.search, color: tokens.textMuted),
                const SizedBox(width: AppSpacing.md),
                Expanded(child: Text(hint, style: TextStyle(color: tokens.textMuted))),
                Icon(Symbols.tune, color: Theme.of(context).colorScheme.primary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 1–5 star rating display.
class RatingStars extends StatelessWidget {
  const RatingStars({super.key, required this.rating, this.count, this.size = 16});

  final double rating;
  final int? count;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = context.sahl.accent;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 1; i <= 5; i++)
          Icon(
            rating >= i ? Icons.star_rounded : (rating >= i - 0.5 ? Icons.star_half_rounded : Icons.star_outline_rounded),
            size: size,
            color: color,
          ),
        const SizedBox(width: 4),
        Text(
          count == null ? rating.toStringAsFixed(1) : '${rating.toStringAsFixed(1)} ($count)',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}

/// Pulsing placeholder block for skeleton loading states.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({super.key, this.height = 16, this.width, this.radius = 10});

  final double height;
  final double? width;
  final double radius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final base = context.sahl.surfaceMuted;
    final highlight = context.sahl.border;
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Container(
        height: widget.height,
        width: widget.width,
        decoration: BoxDecoration(
          color: Color.lerp(base, highlight, _controller.value),
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}

/// Skeleton list of card-shaped rows.
class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key, this.itemCount = 5});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Semantics(
      label: l10n?.loading,
      child: ListView.separated(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.base),
        itemCount: itemCount,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (_, _) => const SahlCard(
          child: Row(
            children: [
              SkeletonBox(height: 44, width: 44, radius: 14),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(height: 14, width: 160),
                    SizedBox(height: AppSpacing.sm),
                    SkeletonBox(height: 12),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Confirmation dialog for destructive or important actions. Returns true
/// only when the user confirms.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  bool destructive = false,
}) async {
  final l10n = AppLocalizations.of(context)!;
  final colorScheme = Theme.of(context).colorScheme;
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: Text(l10n.cancel)),
        FilledButton(
          style: destructive ? FilledButton.styleFrom(backgroundColor: colorScheme.error, minimumSize: const Size(88, 44)) : FilledButton.styleFrom(minimumSize: const Size(88, 44)),
          onPressed: () => Navigator.of(context).pop(true),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Full-screen success confirmation with a single primary action.
class SuccessView extends StatelessWidget {
  const SuccessView({super.key, required this.title, required this.message, required this.actionLabel, required this.onAction});

  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final tokens = context.sahl;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Spacer(),
            Center(
              child: Container(
                height: 132,
                width: 132,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: tokens.brandGradient,
                  boxShadow: [BoxShadow(color: tokens.brandEnd.withValues(alpha: 0.4), blurRadius: 32)],
                ),
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 76),
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: AppSpacing.md),
            Text(message, textAlign: TextAlign.center, style: TextStyle(color: tokens.textMuted, height: 1.6)),
            const Spacer(flex: 2),
            FilledButton(onPressed: onAction, child: Text(actionLabel)),
          ],
        ),
      ),
    );
  }
}
