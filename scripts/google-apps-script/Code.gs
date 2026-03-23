var SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";

function doGet(e) {
  var action = (e.parameter.action || "").trim();
  var callback = (e.parameter.callback || "").trim();

  try {
    if (action === "getPassageByDate") {
      return respond_(getPassageByDate_(e.parameter.date), callback);
    }

    if (action === "getEntriesByDate") {
      return respond_(getEntriesByDate_(e.parameter.date), callback);
    }

    if (action === "getMonthSummary") {
      return respond_(getMonthSummary_(e.parameter.month), callback);
    }

    if (action === "getReplies") {
      return respond_(getReplies_(e.parameter.entryId), callback);
    }

    if (action === "getEntryById") {
      return respond_(getEntryById_(e.parameter.entryId), callback);
    }

    return errorResponse_("Unsupported action: " + action, callback);
  } catch (error) {
    return errorResponse_(error.message || String(error), callback);
  }
}

function respond_(data, callback) {
  return outputPayload_({
    ok: true,
    data: data
  }, callback);
}

function errorResponse_(message, callback) {
  return outputPayload_({
    ok: false,
    error: message
  }, callback);
}

function outputPayload_(payload, callback) {
  var json = JSON.stringify(payload);

  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetRecords_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  var headers = values[0];
  var rows = values.slice(1);

  return rows
    .filter(function(row) {
      return row.some(function(cell) {
        return String(cell).trim() !== "";
      });
    })
    .map(function(row) {
      var record = {};

      headers.forEach(function(header, index) {
        record[String(header)] = row[index];
      });

      return record;
    });
}

function getPassageByDate_(localDate) {
  var records = getSheetRecords_("passage_schedule");
  var match = records.find(function(record) {
    return String(record.local_date) === String(localDate);
  });

  if (!match) {
    return null;
  }

  return {
    local_date: String(match.local_date),
    reference: String(match.reference || "")
  };
}

function getEntriesByDate_(localDate) {
  var entries = getSheetRecords_("entries");
  var replies = getSheetRecords_("replies");
  var replyCountByEntryId = {};

  replies.forEach(function(reply) {
    var entryId = String(reply.entry_id || "");
    replyCountByEntryId[entryId] = (replyCountByEntryId[entryId] || 0) + 1;
  });

  return entries
    .filter(function(entry) {
      return String(entry.local_date) === String(localDate);
    })
    .map(function(entry) {
      var id = String(entry.entry_id || "");

      return {
        entry_id: id,
        member_id: String(entry.member_id || ""),
        local_date: String(entry.local_date || ""),
        created_at: String(entry.created_at || ""),
        status: String(entry.status || "published"),
        passage_reference_snapshot: String(entry.passage_reference_snapshot || ""),
        memorable_line: String(entry.memorable_line || ""),
        reflection: String(entry.reflection || ""),
        application_or_prayer: String(entry.application_or_prayer || ""),
        replyCount: replyCountByEntryId[id] || 0
      };
    })
    .sort(function(a, b) {
      return String(b.created_at).localeCompare(String(a.created_at));
    });
}

function getMonthSummary_(month) {
  var entries = getSheetRecords_("entries");
  var counts = {};

  entries.forEach(function(entry) {
    var localDate = String(entry.local_date || "");
    var status = String(entry.status || "published");

    if (localDate.indexOf(month) !== 0 || status !== "published") {
      return;
    }

    counts[localDate] = (counts[localDate] || 0) + 1;
  });

  return Object.keys(counts)
    .sort()
    .reverse()
    .map(function(localDate) {
      return {
        local_date: localDate,
        entry_count: counts[localDate]
      };
    });
}

function getReplies_(entryId) {
  var replies = getSheetRecords_("replies");

  return replies
    .filter(function(reply) {
      return String(reply.entry_id) === String(entryId);
    })
    .map(function(reply) {
      return {
        reply_id: String(reply.reply_id || ""),
        entry_id: String(reply.entry_id || ""),
        member_id: String(reply.member_id || ""),
        body: String(reply.body || ""),
        created_at: String(reply.created_at || ""),
        updated_at: String(reply.updated_at || "")
      };
    })
    .sort(function(a, b) {
      return String(a.created_at).localeCompare(String(b.created_at));
    });
}

function getEntryById_(entryId) {
  var entries = getSheetRecords_("entries");
  var replies = getSheetRecords_("replies");
  var replyCountByEntryId = {};

  replies.forEach(function(reply) {
    var currentEntryId = String(reply.entry_id || "");
    replyCountByEntryId[currentEntryId] = (replyCountByEntryId[currentEntryId] || 0) + 1;
  });

  var match = entries.find(function(entry) {
    return String(entry.entry_id) === String(entryId);
  });

  if (!match) {
    return null;
  }

  return {
    entry_id: String(match.entry_id || ""),
    member_id: String(match.member_id || ""),
    local_date: String(match.local_date || ""),
    created_at: String(match.created_at || ""),
    status: String(match.status || "published"),
    passage_reference_snapshot: String(match.passage_reference_snapshot || ""),
    memorable_line: String(match.memorable_line || ""),
    reflection: String(match.reflection || ""),
    application_or_prayer: String(match.application_or_prayer || ""),
    replyCount: replyCountByEntryId[String(match.entry_id || "")] || 0
  };
}
