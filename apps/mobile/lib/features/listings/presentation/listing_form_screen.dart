import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/result.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../service_category/application/service_category_controller.dart';
import '../../service_category/domain/service_category.dart';
import '../application/listing_providers.dart';
import '../domain/listing_models.dart';
import 'widgets/listing_card.dart';

const _maxGallery = 8;
const _maxBytes = 5 * 1024 * 1024;
const _minWidth = 800;
const _minHeight = 450;

/// Post a new service, or edit one ([listingId]). Every save goes to admin
/// review before customers see it.
class ListingFormScreen extends ConsumerWidget {
  const ListingFormScreen({super.key, this.listingId});

  final String? listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final title = Text(listingId == null ? l10n.postServiceAction : l10n.editServiceTitle);
    if (listingId == null) return _ListingForm(title: title);
    final existing = ref.watch(listingDetailProvider(listingId!));
    return AsyncValueView<ServiceListing>(
      value: existing,
      loading: Scaffold(appBar: AppBar(title: title), body: const SkeletonList(itemCount: 4)),
      onRetry: () => ref.invalidate(listingDetailProvider(listingId!)),
      data: (context, listing) => _ListingForm(title: title, initial: listing),
    );
  }
}

class _ListingForm extends ConsumerStatefulWidget {
  const _ListingForm({required this.title, this.initial});

  final Widget title;
  final ServiceListing? initial;

  @override
  ConsumerState<_ListingForm> createState() => _ListingFormState();
}

class _ListingFormState extends ConsumerState<_ListingForm> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.initial?.title ?? '');
  late final _description = TextEditingController(text: widget.initial?.description ?? '');
  late final _price = TextEditingController(text: widget.initial == null ? '' : '${widget.initial!.priceFrom}');
  late final _delivery = TextEditingController(text: widget.initial?.deliveryDays?.toString() ?? '');
  late String? _categoryId = widget.initial?.category?.id;
  late String? _coverUrl = widget.initial?.coverUrl;
  late final List<String> _gallery = [...?widget.initial?.images];

  bool _uploadingCover = false;
  int _uploadingGallery = 0;
  bool _saving = false;
  bool _coverMissing = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_title, _description, _price, _delivery]) {
      c.dispose();
    }
    super.dispose();
  }

  void _snack(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  /// Checks size and dimensions before uploading. Returns false to skip.
  Future<bool> _checkImage(XFile file) async {
    final l10n = AppLocalizations.of(context)!;
    final bytes = await file.readAsBytes();
    if (bytes.lengthInBytes > _maxBytes) {
      _snack(l10n.listingImageTooLarge);
      return false;
    }
    try {
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      final (w, h) = (frame.image.width, frame.image.height);
      frame.image.dispose();
      if (w < _minWidth || h < _minHeight) {
        _snack(l10n.listingImageTooSmall);
        return false;
      }
      if (w / h < 1.3) _snack(l10n.listingImageNotLandscape);
      return true;
    } catch (_) {
      _snack(l10n.listingImageUnreadable);
      return false;
    }
  }

  Future<String?> _upload(XFile file) async {
    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(listingRepositoryProvider).uploadImage(file);
    if (!mounted) return null;
    return switch (result) {
      Success(:final value) => value,
      Failure(:final failure) => () {
          _snack(failure is UnknownFailure ? l10n.listingUploadFailed : localizeFailure(l10n, failure));
          return null;
        }(),
    };
  }

  Future<void> _pickCover() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (file == null || !mounted || !await _checkImage(file)) return;
    setState(() => _uploadingCover = true);
    final url = await _upload(file);
    if (!mounted) return;
    setState(() {
      _uploadingCover = false;
      if (url != null) {
        _coverUrl = url;
        _coverMissing = false;
      }
    });
  }

  Future<void> _addGallery() async {
    final remaining = _maxGallery - _gallery.length;
    if (remaining <= 0) return;
    final files = await ImagePicker().pickMultiImage(limit: remaining);
    for (final file in files.take(remaining)) {
      if (!mounted || !await _checkImage(file)) continue;
      setState(() => _uploadingGallery++);
      final url = await _upload(file);
      if (!mounted) return;
      setState(() {
        _uploadingGallery--;
        if (url != null && _gallery.length < _maxGallery) _gallery.add(url);
      });
    }
  }

  bool get _busy => _saving || _uploadingCover || _uploadingGallery > 0;

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    final valid = _formKey.currentState!.validate();
    setState(() => _coverMissing = _coverUrl == null);
    if (!valid || _coverUrl == null || _busy) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final draft = ListingDraft(
      categoryId: _categoryId!,
      title: _title.text.trim(),
      description: _description.text.trim(),
      priceFrom: int.parse(_price.text.trim()),
      deliveryDays: int.tryParse(_delivery.text.trim()),
      coverUrl: _coverUrl!,
      images: List.of(_gallery),
    );
    final repo = ref.read(listingRepositoryProvider);
    final result = widget.initial == null ? await repo.create(draft) : await repo.update(widget.initial!.id, draft);
    if (!mounted) return;
    switch (result) {
      case Success():
        ref.invalidate(myListingsProvider);
        if (widget.initial != null) ref.invalidate(listingDetailProvider(widget.initial!.id));
        _snack(l10n.listingSubmitted);
        context.pop();
      case Failure(:final failure):
        setState(() {
          _saving = false;
          _error = failure is ApiFailure && failure.errorCode == 'PROVIDER_NOT_ELIGIBLE'
              ? l10n.errorListingNotEligible
              : localizeFailure(l10n, failure);
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final uploads = ref.watch(uploadsEnabledProvider);
    final uploadsOff = uploads.valueOrNull == false;
    final remote = ref.watch(serviceCategoriesProvider(ServiceType.remote)).valueOrNull ?? const <ServiceCategory>[];
    final contract = ref.watch(serviceCategoriesProvider(ServiceType.contract)).valueOrNull ?? const <ServiceCategory>[];

    return Scaffold(
      appBar: AppBar(title: widget.title),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            if (uploadsOff) ...[
              ErrorBanner(message: l10n.listingUploadsOff),
              const SizedBox(height: AppSpacing.md),
            ],
            DropdownButtonFormField<String>(
              initialValue: _categoryId,
              isExpanded: true,
              decoration: InputDecoration(labelText: l10n.listingCategory),
              items: [
                for (final (label, items) in [(l10n.serviceTypeShortTerm, remote), (l10n.serviceTypeLongTerm, contract)])
                  for (final c in items)
                    DropdownMenuItem(value: c.id, child: Text('${c.name} · $label', overflow: TextOverflow.ellipsis)),
              ],
              onChanged: _busy ? null : (v) => setState(() => _categoryId = v),
              validator: (v) => v == null ? l10n.validationRequired : null,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _title,
              enabled: !_saving,
              maxLength: 100,
              decoration: InputDecoration(labelText: l10n.listingTitleLabel, hintText: l10n.listingTitleHint),
              validator: (v) => (v?.trim().length ?? 0) < 5 ? l10n.validationDescriptionTooShort : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _description,
              enabled: !_saving,
              minLines: 5,
              maxLines: 12,
              maxLength: 5000,
              decoration: InputDecoration(
                labelText: l10n.listingDescriptionLabel,
                hintText: l10n.listingDescriptionHint,
                alignLabelWithHint: true,
              ),
              validator: (v) => (v?.trim().length ?? 0) < 20 ? l10n.validationDescriptionTooShort : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _price,
                    enabled: !_saving,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(9)],
                    decoration: InputDecoration(labelText: l10n.listingPriceLabel, prefixIcon: const Icon(Symbols.sell)),
                    validator: (v) => (int.tryParse(v ?? '') ?? 0) < 1 ? l10n.validationRequired : null,
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: TextFormField(
                    controller: _delivery,
                    enabled: !_saving,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
                    decoration: InputDecoration(labelText: l10n.listingDeliveryLabel, prefixIcon: const Icon(Symbols.schedule)),
                    validator: (v) {
                      if (v == null || v.isEmpty) return null;
                      final n = int.tryParse(v) ?? 0;
                      return n < 1 || n > 365 ? l10n.validationRequired : null;
                    },
                  ),
                ),
              ],
            ),

            SectionHeader(title: l10n.listingCoverTitle),
            Text(l10n.listingCoverGuide, style: TextStyle(color: tokens.textMuted, fontSize: 13, height: 1.5)),
            const SizedBox(height: AppSpacing.md),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (_coverUrl != null)
                      ListingCover(url: _coverUrl!, width: 1280)
                    else
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: tokens.surfaceMuted,
                          border: Border.all(color: _coverMissing ? Theme.of(context).colorScheme.error : tokens.border),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(child: Icon(Symbols.add_photo_alternate, size: 44, color: tokens.textMuted)),
                      ),
                    if (_uploadingCover)
                      ColoredBox(
                        color: Theme.of(context).colorScheme.scrim.withValues(alpha: 0.4),
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                  ],
                ),
              ),
            ),
            if (_coverMissing) ...[
              const SizedBox(height: 6),
              Text(l10n.listingCoverRequired, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12)),
            ],
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: uploadsOff || _busy ? null : _pickCover,
              icon: const Icon(Symbols.image),
              label: Text(_coverUrl == null ? l10n.listingCoverPick : l10n.listingCoverChange),
            ),

            SectionHeader(title: l10n.listingGalleryTitle),
            Text(l10n.listingGalleryGuide(_maxGallery), style: TextStyle(color: tokens.textMuted, fontSize: 13)),
            const SizedBox(height: AppSpacing.md),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 16 / 9,
              children: [
                for (final url in _gallery)
                  Stack(
                    fit: StackFit.expand,
                    children: [
                      ListingCover(url: url, width: 480, borderRadius: BorderRadius.circular(12)),
                      PositionedDirectional(
                        top: 4,
                        end: 4,
                        child: IconButton.filledTonal(
                          visualDensity: VisualDensity.compact,
                          tooltip: l10n.listingRemoveImage,
                          icon: const Icon(Symbols.close, size: 18),
                          onPressed: _saving ? null : () => setState(() => _gallery.remove(url)),
                        ),
                      ),
                    ],
                  ),
                for (var i = 0; i < _uploadingGallery; i++)
                  DecoratedBox(
                    decoration: BoxDecoration(color: tokens.surfaceMuted, borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: CircularProgressIndicator()),
                  ),
              ],
            ),
            if (_gallery.length + _uploadingGallery < _maxGallery) ...[
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: uploadsOff || _busy ? null : _addGallery,
                icon: const Icon(Symbols.add_photo_alternate),
                label: Text(l10n.listingGalleryAdd),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Symbols.verified_user, size: 18, color: tokens.info),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: Text(l10n.listingReviewNote, style: TextStyle(color: tokens.textMuted, fontSize: 13))),
              ],
            ),
            if (_error != null) ...[const SizedBox(height: AppSpacing.md), ErrorBanner(message: _error!)],
            const SizedBox(height: 96),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(AppSpacing.base),
        child: FilledButton(
          onPressed: uploadsOff || _busy ? null : _submit,
          child: _saving
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(l10n.listingSubmit),
        ),
      ),
    );
  }
}
