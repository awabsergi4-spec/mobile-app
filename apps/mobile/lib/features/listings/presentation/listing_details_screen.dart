import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/result.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/current_user.dart';
import '../../remote/application/remote_controller.dart';
import '../../remote/domain/remote_engagement.dart';
import '../application/listing_providers.dart';
import '../domain/listing_models.dart';
import 'widgets/listing_card.dart';

/// A posted service: swipeable cover + gallery, details, provider, order.
class ListingDetailsScreen extends ConsumerWidget {
  const ListingDetailsScreen({super.key, required this.listingId});

  final String listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listing = ref.watch(listingDetailProvider(listingId));
    return Scaffold(
      appBar: AppBar(title: Text(listing.valueOrNull?.category?.name ?? '')),
      body: AsyncValueView<ServiceListing>(
        value: listing,
        loading: const SkeletonList(itemCount: 3),
        onRetry: () => ref.invalidate(listingDetailProvider(listingId)),
        data: (context, l) => _Body(listing: l),
      ),
      bottomNavigationBar: listing.valueOrNull == null ? null : _OrderBar(listing: listing.value!),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.listing});

  final ServiceListing listing;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final provider = listing.provider;
    return ListView(
      padding: const EdgeInsets.only(bottom: 120),
      children: [
        _Gallery(urls: [listing.coverUrl, ...listing.images]),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.base),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(listing.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, height: 1.3)),
              const SizedBox(height: AppSpacing.md),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  StatusChip(label: l10n.priceFrom(Fmt.number(context, listing.priceFrom)), icon: Symbols.sell, tone: StatusTone.brand),
                  if (listing.deliveryDays != null)
                    StatusChip(label: l10n.listingDeliveryDays(listing.deliveryDays!), icon: Symbols.schedule),
                  if (listing.category != null)
                    StatusChip(
                      label: listing.category!.type == 'CONTRACT' ? l10n.serviceTypeLongTerm : l10n.serviceTypeShortTerm,
                      icon: listing.category!.type == 'CONTRACT' ? Symbols.handshake : Symbols.laptop_mac,
                    ),
                ],
              ),
              if (provider != null) ...[
                SectionHeader(title: l10n.listingAboutProvider),
                SahlCard(
                  onTap: () => context.push('/providers/${provider.id}'),
                  child: Row(
                    children: [
                      SahlAvatar(name: provider.businessName, imageUrl: provider.businessLogoUrl),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(child: Text(provider.businessName, style: const TextStyle(fontWeight: FontWeight.w700))),
                                const SizedBox(width: 4),
                                Icon(Symbols.verified, size: 16, fill: 1, color: tokens.info, semanticLabel: l10n.verifiedProvider),
                              ],
                            ),
                            const SizedBox(height: 2),
                            RatingStars(rating: provider.ratingAverage, count: provider.ratingCount, size: 14),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right_rounded, color: tokens.textMuted),
                    ],
                  ),
                ),
              ],
              if (listing.description != null) ...[
                SectionHeader(title: l10n.listingAboutService),
                SahlCard(child: Text(listing.description!, style: const TextStyle(height: 1.6))),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// Swipeable 16:9 images with a page indicator.
class _Gallery extends StatefulWidget {
  const _Gallery({required this.urls});

  final List<String> urls;

  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: PageView.builder(
            itemCount: widget.urls.length,
            onPageChanged: (i) => setState(() => _page = i),
            itemBuilder: (_, i) => ListingCover(url: widget.urls[i], width: 1280),
          ),
        ),
        if (widget.urls.length > 1) ...[
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < widget.urls.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _page ? 18 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _page ? colorScheme.primary : colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}

class _OrderBar extends ConsumerStatefulWidget {
  const _OrderBar({required this.listing});

  final ServiceListing listing;

  @override
  ConsumerState<_OrderBar> createState() => _OrderBarState();
}

class _OrderBarState extends ConsumerState<_OrderBar> {
  bool _ordering = false;

  Future<void> _order() async {
    final l10n = AppLocalizations.of(context)!;
    final listing = widget.listing;
    final provider = listing.provider!;
    final ok = await showConfirmDialog(
      context,
      title: l10n.listingOrderConfirm,
      message: l10n.listingOrderMessage(listing.title, provider.businessName, Fmt.number(context, listing.priceFrom)),
      confirmLabel: l10n.listingOrderAction,
    );
    if (!ok || !mounted) return;
    setState(() => _ordering = true);
    final result = await ref.read(myRemoteEngagementsControllerProvider(false).notifier).create(
          providerId: provider.id,
          categoryId: listing.category!.id,
          title: listing.title,
          priceType: PriceType.fixed,
          amount: listing.priceFrom,
        );
    if (!mounted) return;
    setState(() => _ordering = false);
    switch (result) {
      case Success(:final value):
        context.pushReplacement('/remote/${value.id}');
      case Failure(:final failure):
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final listing = widget.listing;
    // Only customers order; providers looking at their own listing see no button.
    final isCustomer = ref.watch(authControllerProvider).user?.workspace == UserWorkspace.customer;
    if (!isCustomer || listing.status != ListingStatus.published || listing.provider == null || listing.category == null) {
      return const SizedBox.shrink();
    }
    final isContract = listing.category!.type == 'CONTRACT';
    return SafeArea(
      minimum: const EdgeInsets.all(AppSpacing.base),
      child: FilledButton.icon(
        onPressed: _ordering
            ? null
            : isContract
                ? () => context.push('/contracts/new?categoryId=${listing.category!.id}')
                : _order,
        icon: _ordering
            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : Icon(isContract ? Symbols.request_quote : Symbols.shopping_bag),
        label: Text(isContract ? l10n.listingQuoteAction : '${l10n.listingOrderAction} · ${Fmt.number(context, listing.priceFrom)}'),
      ),
    );
  }
}
