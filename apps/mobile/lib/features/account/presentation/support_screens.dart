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
import '../../../shared/widgets/empty_state_view.dart';
import '../../../shared/widgets/error_banner.dart';
import '../../../shared/widgets/sahl_ui.dart';
import '../application/account_providers.dart';
import '../domain/account_models.dart';
import 'account_settings_screens.dart';

/// Help & support: the user's tickets.
class SupportTicketsScreen extends ConsumerWidget {
  const SupportTicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final tickets = ref.watch(supportTicketsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.helpSupport)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/support/new'),
        icon: const Icon(Symbols.add),
        label: Text(l10n.supportNewTicket),
      ),
      body: AsyncValueView<List<SupportTicket>>(
        value: tickets,
        loading: const SkeletonList(),
        onRetry: () => ref.invalidate(supportTicketsProvider),
        data: (context, items) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(supportTicketsProvider),
          child: items.isEmpty
              ? ListView(children: [const SizedBox(height: 80), EmptyStateView(icon: Symbols.support_agent, message: l10n.supportEmpty)])
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.base, AppSpacing.base, 96),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) {
                    final t = items[i];
                    final (label, tone) = ticketStatusLabel(l10n, t.status);
                    return SahlCard(
                      onTap: () => context.push('/support/${t.id}'),
                      child: Row(
                        children: [
                          IconBadge(icon: Symbols.support_agent, color: context.sahl.info),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(t.subject, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 2),
                                Text(Fmt.date(context, t.createdAt), style: TextStyle(color: context.sahl.textMuted, fontSize: 12)),
                              ],
                            ),
                          ),
                          StatusChip(label: label, tone: tone),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

/// Open a new support ticket.
class NewSupportTicketScreen extends ConsumerStatefulWidget {
  const NewSupportTicketScreen({super.key});

  @override
  ConsumerState<NewSupportTicketScreen> createState() => _NewSupportTicketScreenState();
}

class _NewSupportTicketScreenState extends ConsumerState<NewSupportTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_sending || !_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _sending = true;
      _error = null;
    });
    final result = await ref.read(accountRepositoryProvider).openTicket(subject: _subject.text.trim(), message: _message.text.trim());
    if (!mounted) return;
    switch (result) {
      case Success(:final value):
        ref.invalidate(supportTicketsProvider);
        context.pushReplacement('/support/${value.id}');
      case Failure(:final failure):
        setState(() {
          _sending = false;
          _error = localizeFailure(l10n, failure);
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.supportNewTicket)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.base),
          children: [
            TextFormField(
              controller: _subject,
              enabled: !_sending,
              maxLength: 150,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.supportSubject),
              validator: (v) => (v?.trim().length ?? 0) < 3 ? l10n.validationRequired : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _message,
              enabled: !_sending,
              minLines: 5,
              maxLines: 10,
              maxLength: 4000,
              decoration: InputDecoration(labelText: l10n.supportMessage, alignLabelWithHint: true),
              validator: (v) {
                final text = v?.trim() ?? '';
                if (text.isEmpty) return l10n.validationRequired;
                return text.length < 5 ? l10n.validationDescriptionTooShort : null;
              },
            ),
            if (_error != null) ...[const SizedBox(height: AppSpacing.sm), ErrorBanner(message: _error!)],
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(AppSpacing.base),
        child: FilledButton.icon(
          onPressed: _sending ? null : _send,
          icon: _sending
              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Symbols.send),
          label: Text(l10n.supportSend),
        ),
      ),
    );
  }
}

/// A ticket's conversation with a reply box.
class SupportTicketScreen extends ConsumerStatefulWidget {
  const SupportTicketScreen({super.key, required this.ticketId});

  final String ticketId;

  @override
  ConsumerState<SupportTicketScreen> createState() => _SupportTicketScreenState();
}

class _SupportTicketScreenState extends ConsumerState<SupportTicketScreen> {
  final _reply = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _reply.text.trim();
    if (_sending || text.isEmpty) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() => _sending = true);
    final result = await ref.read(accountRepositoryProvider).replyTicket(widget.ticketId, text);
    if (!mounted) return;
    setState(() => _sending = false);
    switch (result) {
      case Success():
        _reply.clear();
        ref.invalidate(supportTicketProvider(widget.ticketId));
        ref.invalidate(supportTicketsProvider);
      case Failure(:final failure):
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(localizeFailure(l10n, failure))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final ticket = ref.watch(supportTicketProvider(widget.ticketId));
    final colorScheme = Theme.of(context).colorScheme;
    final tokens = context.sahl;
    return Scaffold(
      appBar: AppBar(title: Text(ticket.valueOrNull?.subject ?? l10n.helpSupport)),
      body: AsyncValueView<SupportTicket>(
        value: ticket,
        loading: const SkeletonList(itemCount: 3),
        onRetry: () => ref.invalidate(supportTicketProvider(widget.ticketId)),
        data: (context, t) {
          final closed = t.status == TicketStatus.closed;
          final (label, tone) = ticketStatusLabel(l10n, t.status);
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.base, AppSpacing.sm, AppSpacing.base, 0),
                child: Row(children: [StatusChip(label: label, tone: tone), const Spacer(), Text(Fmt.date(context, t.createdAt))]),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async => ref.invalidate(supportTicketProvider(widget.ticketId)),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppSpacing.base),
                    itemCount: t.messages.length,
                    itemBuilder: (context, i) {
                      final m = t.messages[i];
                      return Align(
                        alignment: m.fromMe ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                          constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
                          decoration: BoxDecoration(
                            color: m.fromMe ? colorScheme.primary : tokens.surfaceMuted,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(m.body, style: TextStyle(color: m.fromMe ? colorScheme.onPrimary : null, height: 1.4)),
                              const SizedBox(height: 4),
                              Text(
                                Fmt.dateTime(context, m.sentAt),
                                style: TextStyle(fontSize: 11, color: m.fromMe ? colorScheme.onPrimary.withValues(alpha: 0.75) : tokens.textMuted),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              SafeArea(
                top: false,
                minimum: const EdgeInsets.all(AppSpacing.sm),
                child: closed
                    ? Padding(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        child: Text(l10n.supportClosedNote, style: TextStyle(color: tokens.textMuted)),
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _reply,
                              enabled: !_sending,
                              minLines: 1,
                              maxLines: 4,
                              maxLength: 4000,
                              decoration: InputDecoration(hintText: l10n.supportReplyHint, counterText: ''),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          IconButton.filled(
                            tooltip: l10n.supportSend,
                            onPressed: _sending ? null : _send,
                            icon: _sending
                                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                                : const Icon(Symbols.send),
                          ),
                        ],
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
