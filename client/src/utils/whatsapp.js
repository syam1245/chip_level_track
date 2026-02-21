export const generateWhatsAppMessage = (item) => {
    const { status, brand, jobNumber, customerName, issue } = item;
    const name = customerName ? customerName.split(' ')[0] : 'Customer';
    const issueText = issue ? ` (${issue})` : '';

    let message = "";

    switch (status) {
        case 'Received':
            message = `Hi ${name}, we have received your ${brand} device (Job Number ${jobNumber}). It is awaiting diagnosis. We will update you soon.`;
            break;

        case 'In Progress':
            message = `Hi ${name}, your ${brand} device (Job Number ${jobNumber})${issueText} is currently under repair. We will keep you informed of any updates.`;
            break;

        case 'Waiting for Parts':
            message = `Hi ${name}, your ${brand} device (Job Number ${jobNumber}) is on hold while we await the required spare part. We will notify you once it arrives.`;
            break;

        case 'Sent to Service':
            message = `Hi ${name}, your ${brand} device (Job Number ${jobNumber}) has been forwarded to our technical team for further assessment and repair. We will update you once it is returned.`;
            break;

        case 'Ready':
            message = `Hi ${name}, your ${brand} device (Job Number ${jobNumber}) has been repaired and is ready for pickup. Please collect it at your convenience.`;
            break;

        case 'Delivered':
            message = `Hi ${name}, this confirms that your ${brand} device (Job Number ${jobNumber}) has been delivered. Thank you for choosing our services.`;
            break;

        case 'Return':
            message = `Hi ${name}, after thorough inspection and multiple repair attempts, your ${brand} device (Job Number ${jobNumber}) has been determined to be beyond repair. The unit has been processed for return. Please contact us for further assistance.`;
            break;

        default:
            message = `Hi ${name}, regarding your ${brand} device (Job Number ${jobNumber}), please contact us for an update.`;
            break;
    }

    return message;
};
