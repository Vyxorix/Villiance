package app.villiance.chess;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;

public class MainActivity extends Activity {
    private WebView webView;
    private LocalSiteServer site;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        site = new LocalSiteServer();
        try {
            site.start(getAssets());
        } catch (IOException err) {
            setContentView(messageView("Villiance could not open the bundled board."));
            return;
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0c0d0b"));
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        final String origin = "http://127.0.0.1:" + site.port() + "/";
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                String host = uri.getHost() == null ? "" : uri.getHost();
                if ("mailto".equals(scheme)) {
                    startActivity(new Intent(Intent.ACTION_SENDTO, uri));
                    return true;
                }
                if ("http".equals(scheme) && ("127.0.0.1".equals(host) || "localhost".equals(host))) {
                    return false;
                }
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return false;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request == null || !request.isForMainFrame()) return;
                view.loadDataWithBaseURL(
                        null,
                        messageHtml("The bundled board did not load. Reinstall Villiance and try again."),
                        "text/html",
                        "utf-8",
                        null);
            }
        });

        setContentView(webView);
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(origin);
        }
    }

    private android.view.View messageView(String text) {
        android.widget.TextView view = new android.widget.TextView(this);
        view.setBackgroundColor(Color.parseColor("#0c0d0b"));
        view.setTextColor(Color.parseColor("#eceae4"));
        view.setTextSize(16f);
        view.setPadding(48, 96, 48, 48);
        view.setText(text);
        return view;
    }

    private static String messageHtml(String text) {
        return "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<style>body{margin:0;background:#0c0d0b;color:#eceae4;font:16px/1.5 sans-serif}"
                + "main{max-width:28rem;margin:0 auto;padding:3rem 1.25rem}"
                + "a{color:#eceae4}</style></head><body><main><h1>Villiance</h1><p>"
                + text
                + "</p><p>Support <a href=\"mailto:vyxorix@gmail.com\">vyxorix@gmail.com</a></p></main></body></html>";
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        if (site != null) site.stop();
        super.onDestroy();
    }
}
