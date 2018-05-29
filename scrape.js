console.log('scrape')

let language = 'it';
let properties = {
    'P31': 'istance of',
    'P21': 'sex or gender',
    // 'P18': 'image',
    'P27': 'country of citizenship',
    'P569': 'date of birth',
    'P19': 'place of birth',
    'P570': 'date of death',
    'P20': 'place of death',
    'P106': 'occupation'
}
let output = [];

function getIssues() {

    var itemsList = document.getElementById('items-list').value.split("\n");
    console.log(itemsList)

    let counter = 0;
    searchPerson(itemsList[counter]);

    function searchPerson(name) {
        console.log(counter, name)
        // Search for person
        let urlSearchPerson = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${name}&language=${language}&format=json&origin=*`;
        let person = {}
        d3.json(urlSearchPerson).then(function(data) {

            person.found = false;


            if (data.search.length > 0) {
                // console.log(counter, name, data.search[0].concepturi)

                person.found = true;
                person.idWikidata = data.search[0].id;
                person.uri = data.search[0].concepturi;
                person.description = data.search[0].description;
                person.label = data.search[0].label;
                person.originalName = name


                // get all properties id
                let urlAllProperties = `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&entity=${person.idWikidata}&origin=*`;
                d3.json(urlAllProperties).then(function(data) {
                    // console.log(person.label, data);

                    let propertiesAvailable = [];

                    // loop in properties dictionary defined at beginning
                    for (const [key, value] of Object.entries(properties)) {
                        if (data.claims[key]) {

                            data.claims[key].forEach(function(d) {

                                // console.log(d.mainsnak.property, properties[d.mainsnak.property])

                                try {
                                    if (d.mainsnak.datavalue.type == 'time') {
                                        // console.log(d.mainsnak.property, properties[d.mainsnak.property], d.mainsnak.datavalue.value.time, data.claims[key])
                                    } else {

                                        // console.log(d.mainsnak.property, properties[d.mainsnak.property], d.mainsnak.datavalue.value.id, data.claims[key])
                                        propertiesAvailable.push({
                                            'prop id': d.mainsnak.property,
                                            'prop name': properties[d.mainsnak.property],
                                            'value id': d.mainsnak.datavalue.value.id,
                                            // 'value name': properties[d.mainsnak.property]
                                        })

                                    }
                                } catch (err) {
                                    console.warn(err);
                                }


                            })
                        }
                    }


                    // get properties values
                    let urlPropertiesValues = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${propertiesAvailable.map(function(d){return d['value id']}).join('|')}&languages=it&props=labels&origin=*`;
                    d3.json(urlPropertiesValues).then(function(data) {
                        // console.log('props', data.entities);

                        propertiesAvailable.forEach(function(d) {
                            try {
                                d['value name'] = data.entities[d['value id']].labels[language].value;
                            } catch (err) {
                                console.warn(data.entities[d['value id']].labels);
                            }

                            d['original_name'] = name
                            d['found'] = person.found
                            d['idWikidata'] = person.idWikidata
                            d['uri'] = person.uri
                            d['description'] = person.description
                            d['nameWikidata'] = person.label

                        })
                        // console.table(propertiesAvailable);

                        output.push(propertiesAvailable);

                        counter++;
                        if (counter < itemsList.length) {
                            searchPerson(itemsList[counter]);
                        } else {
                            console.log('output:', output);
                            d3.select('#download-button').classed('hidden', false);
                        }


                    });

                })

            } else {
                counter++;
                if (counter < itemsList.length) {
                    searchPerson(itemsList[counter]);
                } else {
                    console.log('output:', output);
                    d3.select('#download-button').classed('hidden', false);
                }
            }


        });
    }

    // var cid = '1a87f8ff8608809c0c7e';
    // var cs = 'cb4dd9c973bf7e377fc9f51330f223c746231550';
    // var baseUrl = 'https://api.github.com/repos/{{userName}}/{{repositoryName}}/issues?client_id={{cid}}&client_secret={{cs}}&state=all&per_page=100&page={{pageIndex}}';
    // baseUrl = baseUrl.replace('{{cid}}', cid);
    // baseUrl = baseUrl.replace('{{cs}}', cs);

    // console.log('Repos to get:', itemsList.length)
    // // console.log(itemsList);

    // var myTable = d3.select('#table-container').append('table')
    //     .classed('table', true)
    //     .classed('table-condensed', true)
    // // .classed('table-hover',true)
    // // .classed('table-striped',true);
    // var firstRow = myTable.append('thead').append('tr').attr('id', 'header');

    // firstRow.append('th').html('repository');
    // firstRow.append('th').html('number');
    // firstRow.append('th').html('title');
    // firstRow.append('th').html('state');
    // firstRow.append('th').html('labels');
    // firstRow.append('th').html('created_at');
    // firstRow.append('th').html('updated_at');
    // firstRow.append('th').html('closed_at');
    // firstRow.append('th').html('comments');
    // firstRow.append('th').html('id');
    // firstRow.append('th').html('issue_url');
    // firstRow.append('th').html('user_id');
    // firstRow.append('th').html('user_login');
    // firstRow.append('th').html('body');

    // myTable = myTable.append('tbody')

    // var count = 0;
    // var page = 1;
    // getInfo(count, page);

    // function getInfo(index, pageIndex) {
    //     if (itemsList[index]) {

    //         console.log(itemsList[index]);
    //         // var itemsList[index] = itemsList[index];
    //         itemsList[index] = itemsList[index].replace('https://github.com/', '');
    //         // console.log(itemsList[index]);
    //         var identifiers = itemsList[index].split('/');
    //         // console.log(identifiers);
    //         var userName = identifiers[0];
    //         var repositoryName = identifiers[1];
    //         var url = baseUrl.replace('{{userName}}', userName).replace('{{repositoryName}}', repositoryName).replace('{{pageIndex}}', pageIndex);
    //         // console.log(url);
    //         d3.json(url, function(err, res) {
    //             if (err) {
    //                 console.error(err);
    //                 return;
    //             }
    //             // console.log(res);
    //             d3.select('#get-button').classed('hidden', true);
    //             if (res.length > 0) {
    //                 // console.log(res.length);
    //                 res.forEach(function(issue, i) {

    //                     if (issue.body) {
    //                         console.log(issue.body)
    //                         // issue.body = issue.body.replace(/<(?:.|\n)*?>/gm, '');
    //                         issue.body = S(issue.body).stripTags().collapseWhitespace().s
    //                     }

    //                     var labelsList = [];
    //                     issue.labels.forEach(function(d) {
    //                         labelsList.push(d.name);
    //                     })

    //                     var thisRow = myTable.append('tr');

    //                     thisRow.append('td').append('a').attr('href', 'https://github.com/' + itemsList[index]).attr('target', '_blank').html(itemsList[index]);

    //                     thisRow.append('td').html(issue.number);
    //                     thisRow.append('td').html(issue.title);
    //                     thisRow.append('td').html(issue.state);
    //                     thisRow.append('td').html(labelsList.toString());
    //                     thisRow.append('td').html(issue.created_at);
    //                     thisRow.append('td').html(issue.updated_at);
    //                     thisRow.append('td').html(issue.closed_at);
    //                     thisRow.append('td').html(issue.comments);
    //                     thisRow.append('td').html(issue.id);
    //                     thisRow.append('td').html(issue.html_url);
    //                     thisRow.append('td').html(issue.user.id);
    //                     thisRow.append('td').html(issue.user.login);
    //                     thisRow.append('td').html(issue.body);

    //                     var obj = {
    //                         'repository': 'https://github.com/' + itemsList[index],
    //                         'id': issue.id,
    //                         'number': issue.number,
    //                         'state': issue.state,
    //                         'created_at': issue.created_at,
    //                         'updated_at': issue.updated_at,
    //                         'closed_at': issue.closed_at,
    //                         'labels': labelsList.toString(),
    //                         'comments': issue.comments,
    //                         'title': issue.title,
    //                         'user_id': issue.user.id,
    //                         'user_login': issue.user.login,
    //                         'issue_url': issue.html_url,
    //                         'body': issue.body
    //                     }

    //                     output.push(obj);

    //                     if (issue.number > 1 && i == (res.length - 1)) {
    //                         // console.log('next page');
    //                         page++;
    //                         // console.log(page);
    //                         window.setTimeout(getInfo(count, page), 1000);

    //                     } else if (issue.number == 1) {
    //                         page = 1;
    //                         count++;
    //                         // console.log(count, page)
    //                         window.setTimeout(getInfo(count, page), 1000);
    //                     }
    //                 })
    //             } else {
    //                 page = 1;
    //                 count++;
    //                 // console.log(count, page)
    //                 window.setTimeout(getInfo(count, page), 1000);
    //                 d3.select('#download-button').classed('hidden', false);
    //             }

    //         })
    //     } else {
    //         if (index < itemsList.length) {
    //             count++;
    //             // console.log('count', count);
    //             window.setTimeout(getInfo(count, page), 1000);
    //         } else {
    //             console.log('output:', output);
    //             d3.select('#download-button').classed('hidden', false);
    //         }
    //     }
    // }
}

function downloadData() {
		console.log('download everything :)')
    // var outputName = 'github-issues.tsv'
    // // repository id  number  state created_at  updated_at  closed_at labels
    // var tsvtxt = 'repository\tid\tnumber\tstate\tcreated_at\tupdated_at\tclosed_at\tlabels\tcomments\ttitle\tuser_id\tuser_login\tissue_url\tbody\n';
    // output.forEach(function(o, i) {
    //     // console.log(o);
    //     tsvtxt += o.repository + '\t' + o.id + '\t' + o.number + '\t' + o.state + '\t' + o.created_at + '\t' + o.updated_at + '\t' + o.closed_at + '\t' + o.labels + '\t' + o.comments + '\t' + o.title + '\t' + o.user_id + '\t' + o.user_login + '\t' + o.issue_url + '\t' + o.body + '\n';
    // });
    // var blob = new Blob([tsvtxt], {
    //     type: "data:text/tsv;charset=utf-8"
    // });
    // saveAs(blob, outputName);
}

function loadSample() {
    document.getElementById('items-list').value = `Italo Calvino\nAbba Giulio Cesare\nAbbagnano Nicola\nAbbas il Grande, scià di Persia\nAbbé Grégoire (Henry Baptiste Grégoire)\nAbbott Edwin Abbott\nAbelardo\nAbernathy Ralph\nAbraham Cresques\nAccrocca Elio Filippo\nAddison Joseph\nAdorno Theodor Wiesengrund\nAfanasjev Aleksandr Nikolaevič\nAgamben Giorgio\nAgostino, santo\nAiolfi Luciano\nAizenberg Roberto\nAlain (Émile Auguste Chartier)\nAlberoni Francesco\nAlberti Leon Battista\nAlbertoni Ettore A.\nAlcmane\nAleramo Sibilla\nAlessandro I, zar\nAlessandro III, zar\nAlfieri Vittorio\nAlgarotti Francesco\nAlighieri Dante\nAllen Woody\nAlmansi Guido\nAltdorfer Albrecht`;
    // document.getElementById('items-list').value = `Italo Calvino\nAbba Giulio Cesare\nAbbé Grégoire (Henry Baptiste Grégoire)\nAbbott Edwin Abbott\nAbelardo\nAgamben Giorgio\nAgostino, santo\nAiolfi Luciano\nAizenberg Roberto\nAlain (Émile Auguste Chartier)\nAlberoni Francesco\nAlberti Leon Battista\nAlbertoni Ettore A.\nAlcmane\nAleramo Sibilla\nAlessandro I, zar\nAlessandro III, zar\nAlfieri Vittorio\nAlgarotti Francesco\nAlighieri Dante\nAllen Woody\nAlmansi Guido\nAltdorfer Albrecht`;
    //
}