let $form = false;

function testForm() {
    $form = document.getElementById('db_search_form');
    // console.log($form);
    return !!($form);
}

function getForm() {
    if ($form) {
        let $exp = /^(.*)\[]$/i;
        let $url = $form.action;
        let $data = {};
        for(let i = 0 ; i < $form.elements.length ; i++){
            let item = $form.elements.item(i);
            if ($exp.test(item.name)) {
                let name = $exp.exec(item.name);
                $data[name[1]] = [];
                for (let j = 0; j < item.options.length; j++) {
                    let option = item.options.item(j);
                    if (option.selected) {
                        $data[name[1]].push(option.value);
                    }
                }
            } else if (item.type == "radio") {
                if (item.checked) {
                    $data[item.name] = item.value;
                }
            } else {
                $data[item.name] = item.value;
            }
        }
        // console.log({
        //     "url": $url,
        //     "data": $data
        // });
        return {
            "url": $url,
            "data": $data
        };
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.runDBSearch) {
            sendResponse(getForm());
        }
        if (request.testDBSearch) {
            sendResponse(testForm());
        }
        if (request.resultDBSearch) {
            // found results
            document.getElementById("searchresults").innerHTML = request.result;

            document.getElementById('togglesearchresultlink')
            // always start with the Show message
                .innerText = "Hide search results";
            document.getElementById('togglesearchresultsdiv')
            // now it's time to show the div containing the link
                .style.display = "block";
            document.getElementById('searchresults').style.display = "block";


            document.getElementById('db_search_form')
            // workaround for Chrome problem (bug #3168569)
            //     .slideToggle()
                .style.display = "none";
            document.getElementById('togglesearchformlink')
            // always start with the Show message
                .innerText = "Hide search results";
            document.getElementById('togglesearchformdiv')
            // now it's time to show the div containing the link
                .style.display = "block";
            // console.log(request.result);
        }
        return true;
    }
);

// console.log("content.js loaded.");
// testForm();
