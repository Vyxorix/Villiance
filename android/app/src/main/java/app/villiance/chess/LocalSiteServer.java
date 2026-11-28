package app.villiance.chess;

import android.content.res.AssetManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Serves the bundled board from assets/www on loopback only.
 * A normal HTTP origin is what lets the Stockfish worker and wasm load.
 */
final class LocalSiteServer {
    private static final int FIRST_PORT = 17431;

    private ServerSocket socket;
    private volatile boolean running;
    private int port = FIRST_PORT;

    int port() {
        return port;
    }

    void start(AssetManager assets) throws IOException {
        socket = new ServerSocket();
        socket.setReuseAddress(true);
        IOException last = null;
        for (int candidate = FIRST_PORT; candidate < FIRST_PORT + 30; candidate++) {
            try {
                socket.bind(new InetSocketAddress("127.0.0.1", candidate));
                port = candidate;
                last = null;
                break;
            } catch (IOException err) {
                last = err;
            }
        }
        if (!socket.isBound()) {
            throw last != null ? last : new IOException("Could not bind the local board");
        }
        running = true;
        Thread thread = new Thread(() -> acceptLoop(assets), "villiance-site");
        thread.setDaemon(true);
        thread.start();
    }

    void stop() {
        running = false;
        ServerSocket open = socket;
        if (open != null) {
            try {
                open.close();
            } catch (IOException ignored) {
                // Closing the socket unblocks accept.
            }
        }
    }

    private void acceptLoop(AssetManager assets) {
        while (running) {
            try {
                Socket client = socket.accept();
                Thread worker = new Thread(() -> handle(assets, client), "villiance-req");
                worker.setDaemon(true);
                worker.start();
            } catch (IOException err) {
                if (!running) return;
            }
        }
    }

    private void handle(AssetManager assets, Socket client) {
        try {
            client.setSoTimeout(10000);
            String request = readHeaders(client.getInputStream());
            if (request == null || request.isEmpty()) return;
            String line = request.split("\r\n", 2)[0];
            String[] parts = line.split(" ");
            if (parts.length < 2) {
                writeResponse(client, 400, "text/plain; charset=utf-8", "Bad request".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String method = parts[0];
            boolean head = "HEAD".equals(method);
            if (!"GET".equals(method) && !head) {
                writeResponse(client, 405, "text/plain; charset=utf-8", "Method not allowed".getBytes(StandardCharsets.UTF_8));
                return;
            }
            String path = pathOf(parts[1]);
            if (path == null) {
                writeResponse(client, 400, "text/plain; charset=utf-8", "Bad path".getBytes(StandardCharsets.UTF_8));
                return;
            }
            byte[] body;
            try {
                body = readAsset(assets, "www/" + path);
            } catch (IOException missing) {
                writeResponse(client, 404, "text/plain; charset=utf-8", "Not found".getBytes(StandardCharsets.UTF_8));
                return;
            }
            writeResponse(client, 200, mime(path), head ? new byte[0] : body, body.length);
        } catch (IOException ignored) {
            // The WebView closed the socket.
        } finally {
            try {
                client.close();
            } catch (IOException ignored) {
                // Already closed.
            }
        }
    }

    private static String pathOf(String rawUrl) {
        String raw = rawUrl;
        int query = raw.indexOf('?');
        if (query >= 0) raw = raw.substring(0, query);
        int hash = raw.indexOf('#');
        if (hash >= 0) raw = raw.substring(0, hash);
        try {
            raw = URLDecoder.decode(raw, "UTF-8");
        } catch (IllegalArgumentException | java.io.UnsupportedEncodingException err) {
            return null;
        }
        if (raw.startsWith("/")) raw = raw.substring(1);
        if (raw.isEmpty()) return "index.html";
        if (raw.endsWith("/")) raw = raw + "index.html";
        if (raw.contains("..") || raw.contains("\\") || raw.indexOf('\0') >= 0 || raw.startsWith("/")) {
            return null;
        }
        return raw;
    }

    private static byte[] readAsset(AssetManager assets, String path) throws IOException {
        try (InputStream in = assets.open(path)) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) >= 0) {
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private static String mime(String path) {
        String lower = path.toLowerCase(Locale.US);
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private static String readHeaders(InputStream in) throws IOException {
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        int value;
        while ((value = in.read()) >= 0) {
            buf.write(value);
            if (buf.size() > 8192) return null;
            int n = buf.size();
            if (n >= 4) {
                byte[] bytes = buf.toByteArray();
                if (bytes[n - 4] == '\r' && bytes[n - 3] == '\n' && bytes[n - 2] == '\r' && bytes[n - 1] == '\n') {
                    return new String(bytes, StandardCharsets.ISO_8859_1);
                }
            }
        }
        return null;
    }

    private static void writeResponse(Socket client, int code, String type, byte[] body) throws IOException {
        writeResponse(client, code, type, body, body.length);
    }

    private static void writeResponse(Socket client, int code, String type, byte[] body, int length) throws IOException {
        String reason = code == 200 ? "OK" : code == 404 ? "Not Found" : code == 405 ? "Method Not Allowed" : "Bad Request";
        String headers = "HTTP/1.1 " + code + " " + reason + "\r\n"
                + "Content-Type: " + type + "\r\n"
                + "Content-Length: " + length + "\r\n"
                + "Connection: close\r\n"
                + "Cache-Control: no-store\r\n"
                + "\r\n";
        OutputStream out = client.getOutputStream();
        out.write(headers.getBytes(StandardCharsets.US_ASCII));
        if (body.length > 0) out.write(body);
        out.flush();
    }
}
