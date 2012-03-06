##
# AWS Product Advertising API json proxy
# (on Google App Engine)
#
# @see http://aws.amazon.com/archives/Product%20Advertising%20API

import logging
import cgi, urllib, urllib2, hmac, hashlib, base64, re
from datetime import datetime

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class AWSProductAdvertising(webapp.RequestHandler):
	def __init__(self):
		self.secret_key    = "YOUR_SECRET_KEY"
		self.aws_pa_domain = "ecs.amazonaws.jp"
		self.aws_pa_path   = "/onca/xml"
			
		self.params = {
			"Service":        "AWSECommerceService",
			"AssociateTag":   "YOUR_ASSCIATE_ID",
			"AWSAccessKeyId": "YOUR_ACCESS_KEY_ID",
			"Version":        "2011-08-01",
			"Timestamp":      datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
			"ContentType":	  "application/javascript"		
		}
		
		self.w3_url = "http://services.w3.org/xslt?"
		self.w3_params = {
			"xslfile": "http://YOUR_HOSTING_LOCATION/xml2json.xslt",
			"content-type": "application/javascript",
			"submit": "transform"
		}
		
	def send_request(self):
		# create query string
		query_strings = []
		for key, value in sorted(self.params.items()):
			logging.info(value)
			query_strings.append(key + "=" + urllib.quote(value.encode('utf-8'), safe="~"))
		
		query_string = "&".join(query_strings)
		
		# create signature
		message    = "\n".join( ['GET', self.aws_pa_domain, self.aws_pa_path, query_string] )
		digest     = hmac.new(self.secret_key, message, hashlib.sha256).digest()
		signature  = urllib.quote( base64.b64encode(digest) )
		
		aws_pa_url = "http://%(domain)s%(path)s?%(query)s&Signature=%(signature)s" % {
			"domain":     self.aws_pa_domain,
			"path":       self.aws_pa_path,
			"query":      query_string,
			"signature":  signature
		}
		
		logging.info(aws_pa_url)
		
		# build w3 xml, xsl converter service url
		query_strings = []
		for key, value in sorted(self.w3_params.items()):
			logging.info(value)
			query_strings.append(key + "=" + urllib.quote(value.encode('utf-8'), safe="~"))
		
		query_string = "&".join(query_strings)
		
		req_url = "%(url)s%(query)s&xmlfile=%(xml)s" %  {
			"url": self.w3_url,
			"query": query_string,
			"xml": urllib.quote(aws_pa_url.encode('utf-8'), safe="~")
		}
		
		return urllib2.urlopen(req_url).read().decode('utf-8')
		
	def get(self):
		for argument in self.request.arguments():
			if not re.search("^_", argument):
				self.params[argument] = self.request.get(argument)
		
		host = self.request.get('_host')
		if host:
			self.aws_pa_domain = host
		
		result_json = self.send_request()
		
		callback    = self.request.get('_callback')
		if callback:
			result_json = callback + "(" + result_json + ")"
		
		self.response.headers['Content-Type'] = 'application/javascript'
		self.response.out.write(result_json)
		

application = webapp.WSGIApplication( [('/onca/json', AWSProductAdvertising)], debug=True )

def main():
	run_wsgi_app(application)
	
if __name__ == "__main__":
	main()
