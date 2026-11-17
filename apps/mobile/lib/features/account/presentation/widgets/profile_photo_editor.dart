import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../../core/errors/app_failure.dart';
import '../../../../core/errors/failure_localizer.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/utils/result.dart';
import '../../../../shared/media/image_upload_field.dart';
import '../../../../shared/media/media_uploader.dart';
import '../../../../shared/widgets/sahl_ui.dart';
import '../../../auth/application/auth_controller.dart';
import '../../application/account_providers.dart';

/// The user's avatar with a camera button: take/choose a photo, upload it and
/// save it on the account; or remove it.
class ProfilePhotoEditor extends ConsumerStatefulWidget {
  const ProfilePhotoEditor({super.key, this.size = 96});

  final double size;

  @override
  ConsumerState<ProfilePhotoEditor> createState() => _ProfilePhotoEditorState();
}

class _ProfilePhotoEditorState extends ConsumerState<ProfilePhotoEditor> {
  bool _busy = false;

  Future<void> _save(String? url) async {
    final l10n = AppLocalizations.of(context)!;
    final result = await ref.read(accountRepositoryProvider).updateProfilePicture(url);
    if (!mounted) return;
    switch (result) {
      case Success():
        await ref.read(authControllerProvider.notifier).refreshCurrentUser();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(url == null ? l10n.profilePhotoRemoved : l10n.profilePhotoUpdated)),
        );
      case Failure(:final failure):
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
  }

  Future<void> _change() async {
    final l10n = AppLocalizations.of(context)!;
    final hasPhoto = ref.read(authControllerProvider).user?.profilePictureUrl != null;
    String? action = 'pick';
    if (hasPhoto) {
      action = await showModalBottomSheet<String>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Symbols.add_a_photo),
                title: Text(l10n.mediaChange),
                onTap: () => Navigator.of(context).pop('pick'),
              ),
              ListTile(
                leading: Icon(Symbols.delete, color: Theme.of(context).colorScheme.error),
                title: Text(l10n.mediaRemove, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                onTap: () => Navigator.of(context).pop('remove'),
              ),
            ],
          ),
        ),
      );
    }
    if (!mounted || action == null) return;
    if (action == 'remove') {
      setState(() => _busy = true);
      await _save(null);
      if (mounted) setState(() => _busy = false);
      return;
    }
    final file = await pickImageFromDeviceOrCamera(context);
    if (file == null || !mounted) return;
    setState(() => _busy = true);
    final uploaded = await ref.read(mediaUploaderProvider).upload(file, MediaPurpose.avatar);
    if (!mounted) return;
    switch (uploaded) {
      case Success(:final value):
        await _save(value);
      case Failure(:final failure):
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(failure is UnknownFailure ? l10n.listingUploadFailed : localizeFailure(l10n, failure)),
        ));
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).user;
    final colorScheme = Theme.of(context).colorScheme;
    final uploadsOff = ref.watch(uploadsEnabledStatusProvider).valueOrNull == false;
    return Semantics(
      button: true,
      label: l10n.profilePhoto,
      child: GestureDetector(
        onTap: _busy || uploadsOff ? null : _change,
        child: SizedBox.square(
          dimension: widget.size,
          child: Stack(
            children: [
              SahlAvatar(name: user?.fullName ?? '', imageUrl: user?.profilePictureUrl, size: widget.size),
              if (_busy)
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.scrim.withValues(alpha: 0.4)),
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                ),
              if (!uploadsOff)
                PositionedDirectional(
                  end: 0,
                  bottom: 0,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: colorScheme.surface, width: 2),
                    ),
                    child: Padding(
                      padding: EdgeInsets.all(widget.size * 0.07),
                      child: Icon(Symbols.photo_camera, size: widget.size * 0.18, color: colorScheme.onPrimary),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
