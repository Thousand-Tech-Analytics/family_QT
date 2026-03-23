var SPREADSHEET_ID = "REPLACE_WITH_YOUR_SPREADSHEET_ID";

function doGet(e) {
  var callback = (e.parameter.callback || "").trim();

  try {
    return dispatchAction_(e.parameter, callback);
  } catch (error) {
    return errorResponse_(error.message || String(error), callback);
  }
}

function doPost(e) {
  try {
    return dispatchAction_(e.parameter || {}, "");
  } catch (error) {
    return errorResponse_(error.message || String(error), "");
  }
}

function dispatchAction_(params, callback) {
  var action = String(params.action || "").trim();

  if (action === "getPassageByDate") {
    return respond_(getPassageByDate_(params.date), callback);
  }

  if (action === "getEntriesByDate") {
    return respond_(getEntriesByDate_(params.date), callback);
  }

  if (action === "getMonthSummary") {
    return respond_(getMonthSummary_(params.month), callback);
  }

  if (action === "getReplies") {
    return respond_(getReplies_(params.entryId), callback);
  }

  if (action === "getEntryById") {
    return respond_(getEntryById_(params.entryId), callback);
  }

  if (action === "saveEntry") {
    return respond_(saveEntry_(params), callback);
  }

  if (action === "addReply") {
    return respond_(addReply_(params), callback);
  }

  return errorResponse_("Unsupported action: " + action, callback);
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

function getSheetWithHeaders_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  var values = sheet.getDataRange().getValues();
  var headers = values.length > 0 ? values[0] : [];

  if (headers.length === 0) {
    throw new Error("Missing headers in sheet: " + sheetName);
  }

  return {
    sheet: sheet,
    headers: headers
  };
}

function buildRowFromHeaders_(headers, record) {
  return headers.map(function(header) {
    return record[String(header)] || "";
  });
}

function findRowIndexByColumnValue_(sheet, columnName, value) {
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return -1;
  }

  var headers = values[0].map(function(header) {
    return String(header);
  });
  var columnIndex = headers.indexOf(columnName);

  if (columnIndex < 0) {
    throw new Error("Missing column: " + columnName);
  }

  for (var index = 1; index < values.length; index += 1) {
    if (String(values[index][columnIndex] || "") === String(value || "")) {
      return index + 1;
    }
  }

  return -1;
}

function upsertSheetRecord_(sheetName, keyColumn, keyValue, record) {
  var sheetData = getSheetWithHeaders_(sheetName);
  var row = buildRowFromHeaders_(sheetData.headers, record);
  var rowIndex = findRowIndexByColumnValue_(sheetData.sheet, keyColumn, keyValue);

  if (rowIndex > 0) {
    sheetData.sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return rowIndex;
  }

  sheetData.sheet.appendRow(row);
  return sheetData.sheet.getLastRow();
}

function nowIsoString_() {
  return new Date().toISOString();
}

function generateId_(prefix) {
  return prefix + "-" + Utilities.getUuid().slice(0, 8);
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

function saveEntry_(params) {
  var entryId = String(params.entryId || "").trim();
  var memberId = String(params.memberId || "").trim();
  var localDate = String(params.localDate || "").trim();
  var status = String(params.status || "draft").trim();
  var passageReferenceSnapshot = String(params.passageReferenceSnapshot || "");
  var memorableLine = String(params.memorableLine || "");
  var reflection = String(params.reflection || "");
  var applicationOrPrayer = String(params.applicationOrPrayer || "");

  if (!memberId || !localDate || !reflection) {
    throw new Error("memberId, localDate, reflection are required");
  }

  var entries = getSheetRecords_("entries");
  var existing = null;

  if (entryId) {
    existing = entries.find(function(entry) {
      return String(entry.entry_id || "") === entryId;
    }) || null;
  }

  if (!existing) {
    existing = entries.find(function(entry) {
      return String(entry.member_id || "") === memberId && String(entry.local_date || "") === localDate;
    }) || null;
  }

  var resolvedEntryId = existing ? String(existing.entry_id || "") : (entryId || generateId_("entry"));
  var createdAt = existing ? String(existing.created_at || "") : nowIsoString_();

  upsertSheetRecord_("entries", "entry_id", resolvedEntryId, {
    entry_id: resolvedEntryId,
    member_id: memberId,
    local_date: localDate,
    created_at: createdAt,
    status: status || "draft",
    passage_reference_snapshot: passageReferenceSnapshot,
    memorable_line: memorableLine,
    reflection: reflection,
    application_or_prayer: applicationOrPrayer
  });

  return getEntryById_(resolvedEntryId);
}

function addReply_(params) {
  var entryId = String(params.entryId || "").trim();
  var memberId = String(params.memberId || "").trim();
  var body = String(params.body || "").trim();

  if (!entryId || !memberId || !body) {
    throw new Error("entryId, memberId, body are required");
  }

  var replyId = generateId_("reply");
  var createdAt = nowIsoString_();

  upsertSheetRecord_("replies", "reply_id", replyId, {
    reply_id: replyId,
    entry_id: entryId,
    member_id: memberId,
    body: body,
    created_at: createdAt,
    updated_at: createdAt
  });

  return {
    reply_id: replyId,
    entry_id: entryId,
    member_id: memberId,
    body: body,
    created_at: createdAt,
    updated_at: createdAt
  };
}
