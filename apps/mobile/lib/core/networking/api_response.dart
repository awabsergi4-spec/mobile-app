/// The unwrapped shape of a successful backend envelope
/// (`{success:true, message, data, pagination, metadata}`) — every
/// ApiClient call that succeeds returns one of these so callers never
/// re-parse the envelope themselves.
class ApiResponseEnvelope {
  const ApiResponseEnvelope({required this.data, this.message, this.pagination, this.metadata});

  final dynamic data;
  final String? message;
  final Map<String, dynamic>? pagination;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> get dataAsMap => data as Map<String, dynamic>;

  List<dynamic> get dataAsList => data as List<dynamic>;
}
