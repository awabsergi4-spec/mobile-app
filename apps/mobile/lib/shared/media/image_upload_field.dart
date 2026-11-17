import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../core/errors/app_failure.dart';
import '../../core/errors/failure_localizer.dart';
import '../../core/l10n/generated/app_localizations.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/result.dart';
import 'media_uploader.dart';

/// Bottom sheet: take a photo or choose one from the gallery. Images are
/// downscaled on the device before upload.
Future<XFile?> pickImageFromDeviceOrCamera(BuildContext context) async {
  final l10n = AppLocalizations.of(context)!;
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Symbols.photo_camera),
            title: Text(l10n.mediaCamera),
            onTap: () => Navigator.of(context).pop(ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Symbols.photo_library),
            title: Text(l10n.mediaGallery),
            onTap: () => Navigator.of(context).pop(ImageSource.gallery),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    ),
  );
  if (source == null) return null;
  return ImagePicker().pickImage(source: source, maxWidth: 2000, maxHeight: 2000, imageQuality: 85);
}

/// Picks (camera or gallery), uploads and shows the result. The parent gets
/// the uploaded URL through [onChanged]; there is no way to type a URL.
class ImageUploadField extends ConsumerStatefulWidget {
  const ImageUploadField({
    super.key,
    required this.purpose,
    required this.onChanged,
    this.initialUrl,
    this.label,
    this.hint,
    this.errorText,
    this.enabled = true,
    this.aspectRatio = 16 / 9,
  });

  final MediaPurpose purpose;
  final ValueChanged<String?> onChanged;
  final String? initialUrl;
  final String? label;
  final String? hint;
  final String? errorText;
  final bool enabled;
  final double aspectRatio;

  @override
  ConsumerState<ImageUploadField> createState() => _ImageUploadFieldState();
}

class _ImageUploadFieldState extends ConsumerState<ImageUploadField> {
  late String? _url = widget.initialUrl;
  XFile? _local;
  bool _uploading = false;

  Future<void> _pick() async {
    final l10n = AppLocalizations.of(context)!;
    final file = await pickImageFromDeviceOrCamera(context);
    if (file == null || !mounted) return;
    setState(() {
      _local = file;
      _uploading = true;
    });
    final result = await ref.read(mediaUploaderProvider).upload(file, widget.purpose);
    if (!mounted) return;
    switch (result) {
      case Success(:final value):
        setState(() {
          _url = value;
          _uploading = false;
        });
        widget.onChanged(value);
      case Failure(:final failure):
        setState(() {
          _local = null;
          _uploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(failure is UnknownFailure ? l10n.listingUploadFailed : localizeFailure(l10n, failure)),
        ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tokens = context.sahl;
    final colorScheme = Theme.of(context).colorScheme;
    final uploadsOff = ref.watch(uploadsEnabledStatusProvider).valueOrNull == false;
    final hasImage = _local != null || _url != null;

    Widget preview;
    if (_local != null) {
      preview = FutureBuilder(
        future: _local!.readAsBytes(),
        builder: (context, snap) => snap.hasData ? Image.memory(snap.data!, fit: BoxFit.cover) : ColoredBox(color: tokens.surfaceMuted),
      );
    } else if (_url != null) {
      // Private document URLs can't be thumbnail-transformed; show as is.
      preview = Image.network(_url!, fit: BoxFit.cover, errorBuilder: (_, _, _) => Icon(Symbols.image, color: tokens.textMuted));
    } else {
      preview = Center(child: Icon(Symbols.add_a_photo, size: 40, color: tokens.textMuted));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.label != null) ...[
          Text(widget.label!, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: AppSpacing.xs),
        ],
        if (widget.hint != null) ...[
          Text(widget.hint!, style: TextStyle(color: tokens.textMuted, fontSize: 12, height: 1.4)),
          const SizedBox(height: AppSpacing.sm),
        ],
        Semantics(
          button: true,
          label: hasImage ? l10n.mediaChange : l10n.mediaPick,
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: !widget.enabled || _uploading || uploadsOff ? null : _pick,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: AspectRatio(
                aspectRatio: widget.aspectRatio,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: tokens.surfaceMuted,
                    border: Border.all(color: widget.errorText != null ? colorScheme.error : tokens.border),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      preview,
                      if (_uploading)
                        ColoredBox(
                          color: colorScheme.scrim.withValues(alpha: 0.4),
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        if (widget.errorText != null) ...[
          const SizedBox(height: 4),
          Text(widget.errorText!, style: TextStyle(color: colorScheme.error, fontSize: 12)),
        ],
        const SizedBox(height: AppSpacing.sm),
        if (uploadsOff)
          Text(l10n.errorUploadsOff, style: TextStyle(color: colorScheme.error, fontSize: 12))
        else
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: !widget.enabled || _uploading ? null : _pick,
                  icon: Icon(hasImage ? Symbols.sync : Symbols.add_a_photo),
                  label: Text(hasImage ? l10n.mediaChange : l10n.mediaPick),
                ),
              ),
            ],
          ),
      ],
    );
  }
}
