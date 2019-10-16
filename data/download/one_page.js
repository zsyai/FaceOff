
/**************************************************************
 *                       Configurations                       *
 **************************************************************/
var userAgent = "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Mobile Safari/537.36";
var viewportSize = { width: 1280, height: 720 }
var scrollHeight = 10000;
var pageRenderTimeLimit = 5000;



/**************************************************************
 *                 Start rendering the webpage                *
 **************************************************************/
var page = require("webpage").create();
var fs = require("fs");
var system = require("system");
var fpath;

page.onConsoleMessage = function(msg) {
    console.log("console: " + msg);
};
page.onCallback = function(msg) {
    if (msg[0] == "data") {
        fs.write(fpath + ".json", msg[1], "w");
        page.render(fpath + ".png");
        console.log("file dumped!");
    }
    phantom.exit();
};

function openURL(url) {
    page.settings.userAgent = userAgent;
    page.open(url, function(status) {
        if (status == 'fail') {
            console.log('Fail to load the webpage!');
            phantom.exit();
        }
        page.viewportSize = viewportSize;
        // Execute JS in the browser
        page.evaluate(function(params) {

            console.log("Page title is " + document.title);
            window.scrollTo(0, params.scrollHeight);

            function getElementTop(element){
                if (!element || !element.style || !element.style.position || element.style.position == "fixed")
                    return element.offsetTop;
                var actualTop = element.offsetTop;
                var parent;
                if (element.style.position == "absolute")
                    parent = element.offsetParent;
                else
                    parent = element.parentNode;
                if (parent)
                    actualTop += getElementTop(parent);
                return actualTop;
            }
            function getElementLeft(element){
                if (!element || !element.style || !element.style.position || element.style.position == "fixed")
                    return element.offsetLeft;
                var actualLeft = element.offsetLeft;
                var parent;
                if (element.style.position == "absolute")
                    parent = element.offsetParent;
                else
                    parent = element.parentNode;
                if (parent)
                    actualLeft += getElementLeft(parent);
                return actualLeft;
            }
            function searchLeaf(node){
                if (!node)
                    return null;
                // Block out invisible nodes such as <script>
                if (node.offsetWidth > 0) {
                    var leaf = new Object();
                    leaf.tag = node.tagName;
                    leaf.class = node.className;
                    leaf.id = node.id;
                    // Important! Captures the CSS style of an element.
                    leaf.css = getComputedStyle(node, null).cssText;
                    leaf.top = getElementTop(node);
                    leaf.left = getElementLeft(node);
                    leaf.width = node.offsetWidth;
                    leaf.height = node.offsetHeight;
                    if (node.innerText)
                        leaf.content = node.innerText.replace(/\n/g, "");
                    else
                        leaf.content = ""
                    leaf.children = new Array();
                    var children = node.children;
                    if (children) {
                        for (var i = 0; i < children.length; i++) {
                            var child = searchLeaf(children[i]);
                            if (child) {
                                leaf.children.push(child);
                            }
                        }
                    }
                    return leaf;
                }
                return null;
            }
            // Main function, obtain the hierarchy of the webpage
            window.setTimeout(function()
            {
                var domtree = new Object();
                domtree.title = document.title;
                domtree.url = document.location.href;
                domtree.tag = "BODY";
                domtree.top = 0;
                domtree.left = 0;
                domtree.timestamp = new Date().getTime();
                domtree.width = document.body.scrollWidth;
                domtree.height = document.body.scrollHeight;
                domtree.tree = searchLeaf(document.getElementsByTagName("body")[0]);
                window.callPhantom(["data", JSON.stringify(domtree, null, 4)]);
            }, params.pageRenderTimeLimit);
        }, { "scrollHeight": scrollHeight, "pageRenderTimeLimit": pageRenderTimeLimit });
    });
}


/**************************************************************
 ** Main entrance:                                            *
 *  handle arguments and execute                              *
 *                                                            *
 ** Usage:                                                    *
 *  phantomjs one_page.js <output_dir> <output_name> <URL>    *
 *                                                            *
 ** You don't need to write file extensions                   *
 **************************************************************/

if (system.args.length < 4) {
    console.log("Usage: phantomjs one_page.js <output_dir> <output_name> <URL>");
    phantom.exit();
}

fpath = system.args[1] + "/" + system.args[2];
openURL(system.args[3]);



