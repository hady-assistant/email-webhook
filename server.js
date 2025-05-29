function processEmails() {
  var threads = GmailApp.search('label:ChatGPT is:unread');
  var webhookUrl = 'https://email-webhook-fibs.onrender.com/webhook';

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var msg = messages[j];
      if (!msg.isUnread()) continue;

      var from = msg.getFrom();
      var subject = msg.getSubject();
      var body = msg.getPlainBody();
      var attachments = msg.getAttachments();
      var extractedText = '';

      for (var k = 0; k < attachments.length; k++) {
        var file = attachments[k];
        var blob = file.copyBlob();
        var mimeType = blob.getContentType();

        Logger.log("Attachment detected: " + file.getName() + " | MIME: " + mimeType);

        // ✅ Convert PDF or Word docs to Google Docs using Drive API v3
        if (
          mimeType === MimeType.PDF ||
          mimeType === "application/pdf" ||
          mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
          mimeType === "application/msword" // .doc
        ) {
          try {
            var blobText = blob.getDataAsString();

            var fileMetadata = {
              name: file.getName(),
              mimeType: 'application/vnd.google-apps.document'
            };

            var media = {
              mimeType: mimeType,
              body: blobText
            };

            var docFile = Drive.Files.create(fileMetadata, media);
            var doc = DocumentApp.openById(docFile.id);
            doc.saveAndClose();
            extractedText += '\n\n--- File: ' + file.getName() + ' ---\n' + doc.getBody().getText();

          } catch (e) {
            Logger.log("❌ Error converting file: " + file.getName() + " - " + e.message);
          }
        }

        // ✅ Handle plain text files (optional)
        else if (mimeType === MimeType.PLAIN_TEXT) {
          extractedText += '\n\n--- File: ' + file.getName() + ' ---\n' + blob.getDataAsString();
        }
      }

      // ✅ Use extracted text or fallback to email body
      var finalText = extractedText.trim() ? extractedText : body;

      var payload = {
        from: from,
        subject: subject,
        body: finalText
      };

      var options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload)
      };

      try {
        UrlFetchApp.fetch(webhookUrl, options);
      } catch (e) {
        Logger.log('❌ Webhook Error: ' + e.message);
      }

      msg.markRead(); // ✅ Mark email as processed
    }
  }
}
