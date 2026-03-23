var SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";

function doGet(e) {
  var action = (e.parameter.action || "").trim();

  try {
    if (action === "getPassageByDate") {
      return jsonResponse(getPassageByDate_(e.parameter.date));
    }

    if (action === "getEntriesByDate") {
      return jsonResponse(getEntriesByDate_(e.parameter.date));
    }

    if (action === "getMonthSummary") {
      return jsonResponse(getMonthSummary_(e.parameter.month));
    }

    if (action === "getReplies") {
      return jsonResponse(getReplies_(e.parameter.entryId));
    }

    if (action === "getEntryById") {
      return jsonResponse(getEntryById_(e.parameter.entryId));
    }

    return errorResponse_("Unsupported action: " + action);
  } catch (error) {
    return errorResponse_(error.message || String(error));
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      data: data
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: false,
      error: message
    })
  ).setMimeType(ContentService.MimeType.JSON);
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
    localDate: String(match.local_date),
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
      var id = String(entry.id || "");

      return {
        id: id,
        authorId: String(entry.author_id || ""),
        localDate: String(entry.local_date || ""),
        createdAtUtc: String(entry.created_at_utc || ""),
        status: String(entry.status || "published"),
        passageReferenceSnapshot: String(entry.passage_reference_snapshot || ""),
        memorableLine: String(entry.memorable_line || ""),
        reflection: String(entry.reflection || ""),
        application: String(entry.application || ""),
        replyCount: replyCountByEntryId[id] || 0
      };
    })
    .sort(function(a, b) {
      return String(b.createdAtUtc).localeCompare(String(a.createdAtUtc));
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
        localDate: localDate,
        entryCount: counts[localDate]
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
        id: String(reply.id || ""),
        entryId: String(reply.entry_id || ""),
        authorId: String(reply.author_id || ""),
        createdAtUtc: String(reply.created_at_utc || ""),
        body: String(reply.body || "")
      };
    })
    .sort(function(a, b) {
      return String(a.createdAtUtc).localeCompare(String(b.createdAtUtc));
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
    return String(entry.id) === String(entryId);
  });

  if (!match) {
    return null;
  }

  return {
    id: String(match.id || ""),
    authorId: String(match.author_id || ""),
    localDate: String(match.local_date || ""),
    createdAtUtc: String(match.created_at_utc || ""),
    status: String(match.status || "published"),
    passageReferenceSnapshot: String(match.passage_reference_snapshot || ""),
    memorableLine: String(match.memorable_line || ""),
    reflection: String(match.reflection || ""),
    application: String(match.application || ""),
    replyCount: replyCountByEntryId[String(match.id || "")] || 0
  };
}
