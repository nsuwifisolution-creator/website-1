# ============ A Records ============
A     @              <SERVER_IP>          # Website utama
A     www            <SERVER_IP>          # WWW
A     api            <SERVER_IP>          # API (opsional)
A     admin          <SERVER_IP>          # Admin panel (opsional)
A     dev            <DEV_SERVER_IP>      # Development
A     staging        <STAGING_SERVER_IP>  # Staging

# ============ CNAME ============
CNAME docs           indotel.id           # Documentation
CNAME status         indotel.id           # Status page

# ============ MX (Email) ============
MX    @              10 aspmx.l.google.com
MX    @              20 alt1.aspmx.l.google.com
MX    @              30 alt2.aspmx.l.google.com

# ============ TXT (Verification & Security) ============
TXT   @              "v=spf1 include:_spf.google.com ~all"
TXT   _dmarc         "v=DMARC1; p=quarantine; rua=mailto:dmarc@indotel.id"
TXT   @              "google-site-verification=xxxxx"

# ============ CNAME (Email) ============
CNAME mail           ghs.googlehosted.com
CNAME calendar       ghs.googlehosted.com
