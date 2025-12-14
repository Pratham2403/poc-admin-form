// This function runs in MongoDB Atlas Triggers
// It is triggered on Insert of a FormResponse document.
import { IFormDocument } from '../models/Form.model.ts';
declare var context: any;

export const responseToSheets = async (changeEvent: any) => {
    const doc = changeEvent.fullDocument;
    const { formId, answers, userId } = doc;

    const collection = context.services.get("mongodb-atlas").db("test").collection("forms");
    const form = await collection.findOne({ _id: formId });

    if (!form || !form.googleSheetUrl) {
        console.log("No form or sheet URL found");
        return;
    }

    // We need to use a service or http client to call Google Sheets API.
    // Atlas Functions have 'context.http'.
    // But authenticating with Google Service Account in Atlas Function is complex (requires JWT signing).
    // Alternatively, we can call our own backend API to do the sync.
    // Or use a 3rd party service.

    // For this POC, the logic is implemented in the backend controller (response.controller.ts).
    // This file serves as a placeholder for where the Atlas Trigger logic would reside.

    console.log("Trigger fired for response", doc._id);
};
