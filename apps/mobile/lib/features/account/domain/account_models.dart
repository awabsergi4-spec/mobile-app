// Models for the account, support and review endpoints in apps/api
// (`routers/account.py`, `routers/feedback.py`).

/// Per-category notification opt-in (`/users/me/notification-preferences`).
class NotificationPrefs {
  const NotificationPrefs({required this.orders, required this.messages, required this.promotions, required this.account});

  factory NotificationPrefs.fromJson(Map<String, dynamic> json) => NotificationPrefs(
        orders: json['orders'] as bool? ?? true,
        messages: json['messages'] as bool? ?? true,
        promotions: json['promotions'] as bool? ?? true,
        account: json['account'] as bool? ?? true,
      );

  final bool orders;
  final bool messages;
  final bool promotions;
  final bool account;

  NotificationPrefs copyWith({bool? orders, bool? messages, bool? promotions, bool? account}) => NotificationPrefs(
        orders: orders ?? this.orders,
        messages: messages ?? this.messages,
        promotions: promotions ?? this.promotions,
        account: account ?? this.account,
      );

  Map<String, dynamic> toJson() => {'orders': orders, 'messages': messages, 'promotions': promotions, 'account': account};
}

enum TicketStatus { open, inProgress, resolved, closed }

TicketStatus _ticketStatus(String v) => switch (v) {
      'IN_PROGRESS' => TicketStatus.inProgress,
      'RESOLVED' => TicketStatus.resolved,
      'CLOSED' => TicketStatus.closed,
      _ => TicketStatus.open,
    };

class SupportMessage {
  const SupportMessage({required this.id, required this.body, required this.fromMe, required this.sentAt});

  factory SupportMessage.fromJson(Map<String, dynamic> json) => SupportMessage(
        id: json['id'] as String,
        body: json['body'] as String,
        fromMe: json['fromMe'] as bool? ?? false,
        sentAt: DateTime.parse(json['sentAt'] as String),
      );

  final String id;
  final String body;
  final bool fromMe;
  final DateTime sentAt;
}

class SupportTicket {
  const SupportTicket({required this.id, required this.subject, required this.status, required this.createdAt, this.messages = const []});

  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
        id: json['id'] as String,
        subject: json['subject'] as String,
        status: _ticketStatus(json['status'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
        messages: ((json['messages'] as List?) ?? const []).cast<Map<String, dynamic>>().map(SupportMessage.fromJson).toList(),
      );

  final String id;
  final String subject;
  final TicketStatus status;
  final DateTime createdAt;
  final List<SupportMessage> messages;
}

/// Which kind of job a review is for (`POST /reviews`).
enum ReviewJobType {
  onDemand('ON_DEMAND'),
  remote('REMOTE'),
  contract('CONTRACT');

  const ReviewJobType(this.wireValue);
  final String wireValue;
}

class MyReview {
  const MyReview({required this.id, required this.rating, this.comment});

  factory MyReview.fromJson(Map<String, dynamic> json) =>
      MyReview(id: json['id'] as String, rating: (json['rating'] as num).toInt(), comment: json['comment'] as String?);

  final String id;
  final int rating;
  final String? comment;
}
