export const generateWhatsAppMessage = (item) => {
    const { status, brand, jobNumber, customerName, issue } = item;
    const name = customerName ? customerName.split(' ')[0] : 'Customer';
    const issueText = issue ? ` reported issue (${issue})` : 'device';

    let message = "";

    switch (status) {
        case 'Received':
            message = `Hi ${name}, this is Admin Info Solution. We have successfully received your ${brand} device (Job #${jobNumber}). Our team is preparing to diagnose it. We'll give you an update soon!`;
            break;
        case 'In Progress':
            message = `Hi ${name}, this is Admin Info Solution. Quick update: our technicians have started working on your ${brand} device (Job #${jobNumber}) to address the ${issueText}. We'll keep you posted on the progress!`;
            break;
        case 'Waiting for Parts':
            message = `Hi ${name}, an update on your ${brand} device (Job #${jobNumber}) from Admin Info Solution. We are currently waiting for a specific spare part to arrive to complete your repair. We appreciate your patience and will notify you as soon as it arrives!`;
            break;
        case 'Sent to Service':
            message = `Hi ${name}, this is Admin Info Solution. Your ${brand} device (Job #${jobNumber}) has been sent to our specialized service center for advanced repairs. Rest assured, it's in expert hands. We'll update you as soon as it's returned.`;
            break;
        case 'Ready':
            message = `Hi ${name}, fantastic news from Admin Info Solution! Your ${brand} device (Job #${jobNumber}) is fully repaired and READY for pickup. Please visit our store at your earliest convenience. See you soon!`;
            break;
        case 'Delivered':
            message = `Hi ${name}, thank you for choosing Admin Info Solution! This message confirms that your ${brand} device (Job #${jobNumber}) has been delivered. If you have any further questions or run into issues, please don't hesitate to reach out. Have a great day!`;
            break;
        case 'Return':
            message = `Hi ${name}, this is Admin Info Solution regarding your ${brand} device (Job #${jobNumber}). We have processed a return for this service request. Please contact us or visit the store at your convenience to discuss the details.`;
            break;
        default:
            message = `Hi ${name}, this is Admin Info Solution regarding your ${brand} device (Job #${jobNumber}). Please give us a call or reply to this message for an update.`;
            break;
    }

    return message;
};
