# Linux package build

The RPM packaging here installs the React frontend, Node.js API service, and Nginx reverse proxy. The API and web server listen on loopback only.

```bash
npm ci
npm run typecheck
npm test
./rpm-build/build-rpm.sh
```

Install the generated RPM using the package manager available on the target system, then initialize and start the local services. The setup script generates an application password and prints it once; sign in to the web interface as `backup`:

Run the installed `setup.sh` as root. It generates an application password and prints it once; sign in to the web interface as `backup`.

Open `http://localhost:8080` and configure SMB and backup jobs in the web interface. Backend state, including the locally stored SMB secret, is kept in `/var/lib/backup-manager`.

This packaging currently targets Linux systems that provide systemd, Nginx, Node.js 18+, rsync, `smbclient`, and CIFS mount utilities. Cross-platform support, including a separate Astra Linux branch, is planned separately.
