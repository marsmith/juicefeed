# node.js/express stack on raspbian

The following info is a guide to setting up a basic node/express web server on a raspberry pi

## Requirements

- HARDWARE: (raspberry pi microSD card, micro USB power supply, HDMI cable, monitor, keyboard).  Monitor and keyboard only necessary for initial setup.
- SOFTWARE: Rasbian OS image (tesed using **June 2018** release) [here](https://www.raspberrypi.org/downloads/raspbian/)

## Install raspbian

Follow steps from raspbian installation guide [here](https://www.raspberrypi.org/documentation/installation/installing-images/README.md)

- Download appropriate raspbian image
- Download and install Etcher.io
- Flash image to microSD card
- Insert microSD card into pi and plug in

## Configure raspbian

Once you have successfully installed the OS, log in with user "pi" password "raspberry"

Run `sudo raspi-config` to run raspberry pi config wizard:

- wifi network, optional (network options)
- enable SSH for remote access (interface options)
- set keyboard layout (localization options)
- set timezone (localization options)
- change default password

Additional security measures (optional but recommended):
- Update all software: `sudo apt-get update` then `sudo apt-get upgrade`.
- Add a new user, and delete default 'pi' user: `sudo adduser alice`.
- To make new user part of the sudo group: `sudo adduser alice sudo`.
- Delete 'pi' user: `sudo deluser -remove-home pi`.
- Install firewall: `sudo apt-get install ufw`.
- Reboot: `sudo reboot`.
- Enable firewall: `sudo ufw enable`.
- Allow access to ports: `sudo ufw allow 80`.

**Wireless config**:
edit wireless setup file with `sudo nano /etc/network/interfaces` and add this to the bottom:

```
allow-hotplug wlan0
iface wlan0 inet manual
    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
```

**Wired config (using DHCP)**: 
Shouldn't have to do anything

**Wired config (static IP)**:
edit IP configuration file: `sudo nano /etc/dhcpcd.conf` add the following to the bottom of the file (ensure the static IP being set is not already in use on the network).

```
#static IP configuration 

interface eth0
static ip_address=192.168.50.50/24 
static routers=192.168.50.1 
static domain_name_servers=192.168.50.1
```

**reboot after any networking change:** `sudo reboot`

## Download and setup software

### Install system wide app dependencies
To get the latest package lists using the package manager (good practice to make sure we are referencing the most recent software repositories):
`sudo apt-get update`

Install required software 
`sudo apt-get install -y git mariadb-client mariadb-server`

Install latest node.js for your version of raspberry pi:
`wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash`

### mariadb setup
set database root user password.  replace 'abc123' below
`sudo mysql -uroot -pabc123 -e "UPDATE mysql.user SET Password = PASSWORD('abc123') WHERE User = 'root';"`
`sudo mysql -uroot -pabc123 -e "CREATE DATABASE juicedb;"`
`sudo mysql -uroot -pabc123 -e "UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE user = 'root' AND plugin = 'unix_socket';FLUSH PRIVILEGES;"`

### download and install juicefeed 
clone from github:
`git clone https://github.com/marsmith/juicefeed`

install npm dependencies:
`cd juicefeed`
`npm install`

Edit config file and replace juice venue values as needed.  This will configure your custom version of the juicefeed to suit your needs: 
`nano juicefeed/config.js`

setup up cron jobs.  cron is a special file that will execute tasks at a predefined interval.  The entry below will run the 'getJuice.js' node script every15 minutes to pull new juice data:
`crontab -e`

enter this on an empty line, where 'alice' is your username/home directory
`*/15 * * * * /usr/bin/node alice/juicefeed/getJuice.js`


### setup 'pm2' to persistently start and keep the node/express server script running (optional):
install pm2:
`sudo npm install pm2 -g`

create symlink for pm2 to enable user run:
`sudo ln -s /opt/nodejs/bin/pm2 /usr/bin/pm2`

start pm2 (replace 'alice' with your username/home directory)
`pm2 start alice/node-juicedb/server.js`
`pm2 startup`
`sudo env PATH=$PATH:/opt/nodejs/bin /opt/nodejs/lib/node_modules/pm2/bin/pm2 startup systemd -u alice --hp /home/alice`
