interface MetaTags {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const setOrCreateMetaTag = (property: string, content: string, isOg: boolean = false) => {
    const selector = isOg ? `meta[property='${property}']` : `meta[name='${property}']`;
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (!element) {
        element = document.createElement('meta');
        if (isOg) {
            element.setAttribute('property', property);
        } else {
            element.setAttribute('name', property);
        }
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
};

export const setMetaTags = (tags: MetaTags) => {
    if (tags.title) {
        document.title = tags.title;
    }
    if (tags.description) {
        setOrCreateMetaTag('description', tags.description);
    }
    // Open Graph (for social media sharing)
    if (tags.ogTitle) {
        setOrCreateMetaTag('og:title', tags.ogTitle, true);
    }
    if (tags.ogDescription) {
        setOrCreateMetaTag('og:description', tags.ogDescription, true);
    }
    // You can add a default image for sharing
    const defaultOgImage = `${window.location.origin}/og-image.png`;
    setOrCreateMetaTag('og:image', tags.ogImage || defaultOgImage, true);
};

export const setStructuredData = (data: object) => {
    const SCRIPT_ID = 'structured-data-jsonld';
    // FIX: The `script` variable was inferred as a generic `HTMLElement`, which does not have a `type` property. Casting the result of `document.getElementById` to `HTMLScriptElement | null` ensures the variable has the correct type, resolving the error when accessing `script.type`.
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (script) {
        script.textContent = JSON.stringify(data, null, 2);
    } else {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data, null, 2);
        document.head.appendChild(script);
    }
};
