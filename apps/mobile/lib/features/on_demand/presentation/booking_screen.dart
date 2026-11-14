import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/errors/failure_localizer.dart';
import '../../../core/l10n/generated/app_localizations.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/result.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/async_value_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../../service_category/application/service_category_controller.dart';
import '../../service_category/domain/service_category.dart';
import '../application/on_demand_controller.dart';
import '../domain/on_demand_request.dart';

enum _Step { service, details, location, time, review }

enum _LocationState { idle, locating, set, denied, off, failed }

/// Customer on-demand booking: service → details → location → time →
/// review → submit (`POST /on-demand`). The service step is skipped when
/// the flow is opened from a service's details screen.
class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key, this.categoryId});

  final String? categoryId;

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  late final List<_Step> _steps = [if (widget.categoryId == null) _Step.service, _Step.details, _Step.location, _Step.time, _Step.review];
  int _index = 0;

  late String? _categoryId = widget.categoryId;
  final _detailsKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  final _address = TextEditingController();
  bool _emergency = false;

  _LocationState _locationState = _LocationState.idle;
  Position? _position;

  bool _scheduled = false;
  DateTime? _scheduledFor;

  bool _submitting = false;
  AppFailure? _failure;
  OnDemandRequest? _created;

  _Step get _step => _steps[_index];

  @override
  void dispose() {
    _description.dispose();
    _address.dispose();
    super.dispose();
  }

  bool get _canContinue => switch (_step) {
        _Step.service => _categoryId != null,
        _Step.details => true, // validated by the form on tap
        _Step.location => _position != null,
        _Step.time => !_scheduled || (_scheduledFor != null && _scheduledFor!.isAfter(DateTime.now())),
        _Step.review => !_submitting,
      };

  void _next() {
    if (_step == _Step.details && !_detailsKey.currentState!.validate()) return;
    if (_step == _Step.review) {
      _submit();
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _index++);
  }

  void _back() {
    if (_index == 0) {
      context.pop();
    } else {
      setState(() => _index--);
    }
  }

  Future<void> _locate() async {
    setState(() => _locationState = _LocationState.locating);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        setState(() => _locationState = _LocationState.off);
        return;
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() => _locationState = _LocationState.denied);
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)),
      );
      if (!mounted) return;
      setState(() {
        _position = position;
        _locationState = _LocationState.set;
      });
    } catch (_) {
      if (mounted) setState(() => _locationState = _LocationState.failed);
    }
  }

  Future<void> _pickTime() async {
    final now = DateTime.now();
    final initial = _scheduledFor ?? now.add(const Duration(hours: 2));
    final date = await showDatePicker(context: context, initialDate: initial, firstDate: now, lastDate: now.add(const Duration(days: 60)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
    if (time == null) return;
    setState(() => _scheduledFor = DateTime(date.year, date.month, date.day, time.hour, time.minute));
  }

  String _fullDescription(AppLocalizations l10n) {
    final text = _description.text.trim();
    final address = _address.text.trim();
    return address.isEmpty ? text : '$text\n\n${l10n.addressPrefix}: $address';
  }

  Future<void> _submit() async {
    if (_submitting) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _submitting = true;
      _failure = null;
    });
    final result = await ref.read(myOnDemandRequestsControllerProvider.notifier).create(
          categoryId: _categoryId!,
          description: _fullDescription(l10n),
          lat: _position!.latitude,
          lng: _position!.longitude,
          isEmergency: _emergency,
          scheduledFor: _scheduled ? _scheduledFor : null,
        );
    if (!mounted) return;
    switch (result) {
      case Success<OnDemandRequest>(:final value):
        setState(() => _created = value);
      case Failure<OnDemandRequest>(:final failure):
        setState(() {
          _submitting = false;
          _failure = failure;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    if (_created != null) {
      return Scaffold(
        body: SafeArea(
          child: SuccessView(
            title: l10n.bookingSuccessTitle,
            message: _created!.scheduledFor != null ? l10n.bookingScheduledSuccessMessage : l10n.bookingSuccessMessage,
            actionLabel: l10n.viewMyRequests,
            onAction: () => context.go('/c/requests'),
          ),
        ),
      );
    }

    return PopScope(
      canPop: _index == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.bookingTitle),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(28),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.base, 0, AppSpacing.base, AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.bookingStepOf(_index + 1, _steps.length), style: TextStyle(color: context.sahl.textMuted, fontSize: 12)),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(value: (_index + 1) / _steps.length, borderRadius: BorderRadius.circular(4)),
                ],
              ),
            ),
          ),
        ),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.base),
            children: [
              Text(
                switch (_step) {
                  _Step.service => l10n.bookingStepService,
                  _Step.details => l10n.bookingStepDetails,
                  _Step.location => l10n.bookingStepLocation,
                  _Step.time => l10n.bookingStepTime,
                  _Step.review => l10n.bookingStepReview,
                },
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: AppSpacing.base),
              switch (_step) {
                _Step.service => _serviceStep(),
                _Step.details => _detailsStep(l10n),
                _Step.location => _locationStep(l10n),
                _Step.time => _timeStep(l10n),
                _Step.review => _reviewStep(l10n),
              },
              if (_failure != null) ...[
                const SizedBox(height: AppSpacing.md),
                ErrorBanner(message: localizeFailure(l10n, _failure!)),
              ],
            ],
          ),
        ),
        bottomNavigationBar: SafeArea(
          minimum: const EdgeInsets.all(AppSpacing.base),
          child: Row(
            children: [
              if (_index > 0) ...[
                Expanded(child: OutlinedButton(onPressed: _submitting ? null : _back, child: Text(l10n.back))),
                const SizedBox(width: AppSpacing.md),
              ],
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _canContinue ? _next : null,
                  child: _submitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(_step == _Step.review ? l10n.bookingSubmit : l10n.next),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _serviceStep() {
    final categories = ref.watch(serviceCategoriesProvider(ServiceType.onDemand));
    return AsyncValueView<List<ServiceCategory>>(
      value: categories,
      loading: const SizedBox(height: 300, child: SkeletonList(itemCount: 4)),
      onRetry: () => ref.invalidate(serviceCategoriesProvider(ServiceType.onDemand)),
      data: (context, items) => RadioGroup<String>(
        groupValue: _categoryId,
        onChanged: (v) => setState(() => _categoryId = v),
        child: Column(
          children: [
            for (final c in items)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: SahlCard(
                  padding: EdgeInsets.zero,
                  onTap: () => setState(() => _categoryId = c.id),
                  child: RadioListTile<String>(
                    value: c.id,
                    title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: c.description == null ? null : Text(c.description!, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detailsStep(AppLocalizations l10n) {
    return Form(
      key: _detailsKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _description,
            minLines: 4,
            maxLines: 8,
            maxLength: 1500,
            textInputAction: TextInputAction.newline,
            decoration: InputDecoration(labelText: l10n.onDemandDescription, hintText: l10n.bookingDescribeHint, alignLabelWithHint: true),
            validator: (v) {
              final text = v?.trim() ?? '';
              if (text.isEmpty) return l10n.validationRequired;
              if (text.length < 5) return l10n.validationDescriptionTooShort;
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.sm),
          SahlCard(
            padding: EdgeInsets.zero,
            child: SwitchListTile(
              value: _emergency,
              onChanged: (v) => setState(() => _emergency = v),
              secondary: Icon(Symbols.emergency, color: Theme.of(context).colorScheme.error),
              title: Text(l10n.bookingEmergency),
              subtitle: Text(l10n.bookingEmergencyHint),
            ),
          ),
        ],
      ),
    );
  }

  Widget _locationStep(AppLocalizations l10n) {
    final tokens = context.sahl;
    final (icon, color, message) = switch (_locationState) {
      _LocationState.set => (Symbols.where_to_vote, tokens.success, l10n.bookingLocationSet),
      _LocationState.denied => (Symbols.location_disabled, Theme.of(context).colorScheme.error, l10n.bookingLocationDenied),
      _LocationState.off => (Symbols.location_off, tokens.warning, l10n.bookingLocationOff),
      _LocationState.failed => (Symbols.error, Theme.of(context).colorScheme.error, l10n.bookingLocationFailed),
      _LocationState.locating => (Symbols.my_location, tokens.info, l10n.bookingLocating),
      _LocationState.idle => (Symbols.location_on, Theme.of(context).colorScheme.primary, l10n.bookingStepLocation),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SahlCard(
          child: Row(
            children: [
              IconBadge(icon: icon, color: color),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: Text(message)),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: _locationState == _LocationState.locating ? null : _locate,
          icon: _locationState == _LocationState.locating
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Symbols.my_location),
          label: Text(l10n.bookingUseLocation),
        ),
        if (_locationState == _LocationState.denied || _locationState == _LocationState.off) ...[
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => _locationState == _LocationState.off ? Geolocator.openLocationSettings() : Geolocator.openAppSettings(),
            child: Text(l10n.openSettings),
          ),
        ],
        const SizedBox(height: AppSpacing.base),
        TextField(
          controller: _address,
          maxLength: 200,
          decoration: InputDecoration(labelText: l10n.bookingAddressHint, prefixIcon: const Icon(Symbols.home_pin)),
        ),
      ],
    );
  }

  Widget _timeStep(AppLocalizations l10n) {
    return RadioGroup<bool>(
      groupValue: _scheduled,
      onChanged: (v) => setState(() => _scheduled = v ?? false),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SahlCard(
            padding: EdgeInsets.zero,
            child: RadioListTile<bool>(value: false, title: Text(l10n.bookingNow), secondary: const Icon(Symbols.bolt)),
          ),
          const SizedBox(height: AppSpacing.sm),
          SahlCard(
            padding: EdgeInsets.zero,
            child: RadioListTile<bool>(
              value: true,
              title: Text(l10n.bookingSchedule),
              subtitle: _scheduledFor == null ? null : Text(Fmt.dateTime(context, _scheduledFor!)),
              secondary: const Icon(Symbols.event),
            ),
          ),
          if (_scheduled) ...[
            const SizedBox(height: AppSpacing.md),
            OutlinedButton.icon(onPressed: _pickTime, icon: const Icon(Symbols.calendar_month), label: Text(l10n.bookingPickTime)),
            if (_scheduledFor != null && !_scheduledFor!.isAfter(DateTime.now()))
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: Text(l10n.bookingScheduleInPast, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ),
          ],
        ],
      ),
    );
  }

  Widget _reviewStep(AppLocalizations l10n) {
    final categories = ref.watch(serviceCategoriesProvider(ServiceType.onDemand)).valueOrNull ?? const <ServiceCategory>[];
    final categoryName = categories.where((c) => c.id == _categoryId).map((c) => c.name).firstOrNull;
    final tokens = context.sahl;
    Widget row(IconData icon, String title, String value) => Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 20, color: tokens.textMuted),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: tokens.textMuted, fontSize: 12)),
                    const SizedBox(height: 2),
                    Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
        );
    return SahlCard(
      child: Column(
        children: [
          if (categoryName != null) row(Symbols.category, l10n.onDemandCategory, categoryName),
          row(Symbols.description, l10n.onDemandDescription, _description.text.trim()),
          if (_address.text.trim().isNotEmpty) row(Symbols.home_pin, l10n.addressPrefix, _address.text.trim()),
          row(Symbols.location_on, l10n.bookingStepLocation, l10n.bookingLocationSet),
          row(
            Symbols.schedule,
            l10n.bookingStepTime,
            _scheduled && _scheduledFor != null ? Fmt.dateTime(context, _scheduledFor!) : l10n.bookingNow,
          ),
          if (_emergency) row(Symbols.emergency, l10n.bookingEmergency, l10n.onDemandEmergencyBadge),
        ],
      ),
    );
  }
}
