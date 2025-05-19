# Netlify Integration Guide

This document describes how the Owl Advisory Group website is integrated with Netlify for hosting and form submissions.

## Deployment

The website is deployed through Netlify's continuous deployment system. When code is pushed to the main branch, Netlify automatically builds and deploys the updated site.

### Site Configuration

In the Netlify dashboard, the following settings should be configured:

1. **Build settings**: No build command is needed as this is a static site
2. **Publish directory**: The root directory (/)
3. **Deploy previews**: Enabled for pull requests

## Form Handling

The website uses Netlify Forms to collect user inquiries and consultation requests. The implementation ensures all submissions are properly handled by Netlify.

### HTML Implementation

1. **Pre-rendering form**: A hidden form is included in the HTML to allow Netlify to detect the form during build/deploy:

```html
<!-- Hidden form for Netlify pre-rendering - required for Netlify Forms to work -->
<form name="owl-consultation" netlify netlify-honeypot="bot-field" hidden>
    <input type="hidden" name="bot-field">
    <input type="email" name="email">
    <input type="text" name="concern">
    <input type="text" name="summary">
    <input type="text" name="fingerprintData">
    <input type="text" name="identityConfidence">
    <input type="text" name="deviceInfo">
    <input type="text" name="browserInfo">
    <input type="hidden" name="form-name" value="owl-consultation">
</form>
```

2. **Active form**: A form with the same name and fields is used for the actual submission:

```html
<form id="hidden-form" name="owl-consultation" netlify netlify-honeypot="bot-field" style="display:none;">
    <!-- Netlify honeypot field to prevent spam -->
    <input type="hidden" name="bot-field">
    <!-- Form fields here -->
    <input type="hidden" name="form-name" value="owl-consultation">
</form>
```

### JavaScript Implementation

The form is submitted programmatically through JavaScript in the `handleSubmitContact` function:

```javascript
// Submit the form to Netlify
fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString()
})
.then(response => {
    if (response.ok) {
        logger.info("Form submitted successfully to Netlify");
    } else {
        logger.error("Netlify form submission error:", response.statusText);
    }
})
.catch(error => {
    logger.error("Netlify form submission error:", error);
});
```

### Content Security Policy

The Content Security Policy has been updated to allow connections to Netlify:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.netlify.app">
```

## Form Notifications

In the Netlify dashboard, form notifications should be configured to forward submissions to info@qryptonic.com. Configure this in:

1. Go to "Forms" in the Netlify dashboard
2. Select the "owl-consultation" form
3. Click on "Form notifications"
4. Add an email notification to info@qryptonic.com

## Spam Prevention

1. The form uses Netlify's built-in honeypot field (`netlify-honeypot="bot-field"`) to prevent spam submissions.
2. Additionally, reCAPTCHA can be enabled in the Netlify dashboard if spam becomes a problem.

## Troubleshooting

If form submissions are not appearing in the Netlify dashboard:

1. Verify that both the hidden form and the active form have the same name attribute.
2. Ensure the form has the `netlify` attribute.
3. Check that the `form-name` field is included in the form data with the correct form name.
4. Verify the Content Security Policy allows connections to Netlify.
5. Test a manual form submission to rule out JavaScript issues.