console.log('scrape')

let language = 'it';
let properties = {
    'P31': 'istance of',
    'P21': 'sex or gender',
    'P27': 'country of citizenship',
    'P569': 'date of birth',
    'P19': 'place of birth',
    'P570': 'date of death',
    'P20': 'place of death',
    'P106': 'occupation'
}

let percentage = 0;

var myTable = d3.select('#table-container').append('table')
    .classed('table', true)
    .classed('table-condensed', true)

let tableHead = myTable.append('thead').append('tr').attr('id', 'header');

tableHead.append('th').html('idWikidata');
tableHead.append('th').html('original_name');
tableHead.append('th').html('nameWikidata');
tableHead.append('th').html('description');
tableHead.append('th').html('uri');
tableHead.append('th').html('prop id');
tableHead.append('th').html('prop value');
tableHead.append('th').html('value id');
tableHead.append('th').html('value name');
tableHead.append('th').html('found');

let output = [];

let rows = myTable.append('tbody').selectAll('tr').data(output, function(d) { return d.idWikidata })

function updateTable() {

    // output = output.sort(function(a, b) {
    //     var textA = a.original_name //.toUpperCase();
    //     var textB = b.original_name //.toUpperCase();
    //     return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    // });

    rows = rows.data(output, function(d) { return d.idWikidata });

    rows.exit().remove();

    rows = rows.enter()
        .append('tr')
        .attr('class', function(d) { return d.idWikidata })
        .classed('warn', function(d) {
            return d['prop id'] == 'P31' && d['value id'] != 'Q5' ? true : false;
        })
        .classed('not-found', function(d) {
            return !d.found;
        })
        .html(function(d) {
            let rowHTML = `
                <td class="">
                    <input type="text" name="wiki-id" value="${d.idWikidata} ">
                    <input class="refresh-data hidden" type="button" onclick="replaceNameData('${d.idWikidata}', d3.select( 'tr.${d.idWikidata} input' ).property('value') )" value="refresh">
                </td>
                <td class="original-name">${d.original_name}</td>
                <td class="">${d.nameWikidata}</td>
                <td class="">${d.description}</td>
                <td class="">${d.uri}</td>
                <td class="">${d['prop id']}</td>
                <td class="">${d['prop value']}</td>
                <td class="">${d['value id']}</td>
                <td class="">${d['value name']}</td>
                <td class="">${d['found']}</td>
            `;
            return rowHTML;
        })

        .merge(rows);

}

function replaceNameData(old_id, new_id) {
    console.log(`replace ${old_id} with ${new_id}`);
    d3.selectAll('input.refresh-data').classed('hidden', true);

    output = _.remove(output, function(n) {
        return n.idWikidata != old_id;
    });

    d3.json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${new_id}&languages=it&origin=*`).then(function(data) {

        let person = {}
        person.found = true;
        person.idWikidata = new_id;
        person.uri = `http://www.wikidata.org/entity/${new_id}`;
        person.description = data.entities[new_id].descriptions[language].value;
        person.label = data.entities[new_id].labels[language].value;
        person.originalName = d3.select(`tr.${old_id} td.original-name`).html();

        console.log(person)

        // get all properties id
        let urlAllProperties = `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&entity=${new_id}&origin=*`;
        d3.json(urlAllProperties).then(function(data) {

            let propertiesAvailable = [];

            // loop in properties dictionary defined at beginning
            for (const [key, value] of Object.entries(properties)) {
                if (data.claims[key]) {

                    data.claims[key].forEach(function(d) {

                        try {
                            if (d.mainsnak.datavalue.type == 'time') {

                                let obj = {
                                    'prop id': d.mainsnak.property,
                                    'prop name': properties[d.mainsnak.property],
                                    'value id': d.mainsnak.datavalue.value.time,
                                    'value name': d.mainsnak.datavalue.value.time
                                }

                                obj['original_name'] = person.originalName
                                obj['found'] = person.found
                                obj['idWikidata'] = person.idWikidata
                                obj['uri'] = person.uri
                                obj['description'] = person.description
                                obj['nameWikidata'] = person.label


                                output.push(obj);


                            } else {

                                propertiesAvailable.push({
                                    'prop id': d.mainsnak.property,
                                    'prop name': properties[d.mainsnak.property],
                                    'value id': d.mainsnak.datavalue.value.id,
                                    'value name': undefined
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

                propertiesAvailable.forEach(function(d) {

                    try {
                        d['value name'] = data.entities[d['value id']].labels[language].value;
                    } catch (err) {
                        console.warn(d['value id'], data.entities[d['value id']].labels);
                    }

                    d['original_name'] = person.originalName
                    d['found'] = person.found
                    d['idWikidata'] = person.idWikidata
                    d['uri'] = person.uri
                    d['description'] = person.description
                    d['nameWikidata'] = person.label

                    output.push(d);

                })
                updateTable();
                finish();
            });

        })
    })
}

function finish() {
    d3.select('#download-button').classed('hidden', false);
    d3.selectAll('input.refresh-data').classed('hidden', false);

}

function getIssues() {
    var itemsList;
    let counter = 0;

    itemsList = document.getElementById('items-list').value.split("\n");
    // console.log(itemsList)
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

                                try {
                                    if (d.mainsnak.datavalue.type == 'time') {

                                        // console.log(d.mainsnak.property, properties[d.mainsnak.property], d.mainsnak.datavalue.value.time, data.claims[key])

                                        let obj = {
                                            'prop id': d.mainsnak.property,
                                            'prop value': properties[d.mainsnak.property],
                                            'value id': d.mainsnak.datavalue.value.time,
                                            'value name': d.mainsnak.datavalue.value.time
                                        }

                                        obj['original_name'] = name
                                        obj['found'] = person.found
                                        obj['idWikidata'] = person.idWikidata
                                        obj['uri'] = person.uri
                                        obj['description'] = person.description
                                        obj['nameWikidata'] = person.label


                                        output.push(obj);


                                    } else {

                                        // console.log(d.mainsnak.property, properties[d.mainsnak.property], d.mainsnak.datavalue.value.id, data.claims[key])
                                        propertiesAvailable.push({
                                            'prop id': d.mainsnak.property,
                                            'prop value': properties[d.mainsnak.property],
                                            'value id': d.mainsnak.datavalue.value.id,
                                            'value name': undefined
                                        })

                                    }
                                } catch (err) {
                                    console.warn(err);
                                }


                            })
                        }
                    }

                    // console.table(propertiesAvailable);


                    // get properties values
                    let urlPropertiesValues = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${propertiesAvailable.map(function(d){return d['value id']}).join('|')}&languages=it&props=labels&origin=*`;
                    d3.json(urlPropertiesValues).then(function(data) {

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

                            output.push(d);

                        })

                        updateTable();
                        percentage = (counter + 1) / itemsList.length * 100;
                        d3.select('.percentage .bar').style('width', percentage + '%')
                        if (percentage == 100) d3.select('.percentage .bar').style('background-color', '#48C9B0');
                        // recursively recall this function itself as the scraping for this persone ended
                        counter++;
                        if (counter < itemsList.length) {
                            searchPerson(itemsList[counter]);
                        } else {
                            finish();
                        }


                    });

                })

            } else {
                output.push({
                    'original_name': name,
                    'found': person.found,
                    'idWikidata': S(name).slugify().s
                })
                updateTable();
                percentage = (counter + 1) / itemsList.length * 100;
                d3.select('.percentage .bar').style('width', percentage + '%')
                if (percentage == 100) d3.select('.percentage .bar').style('background-color', '#48C9B0');
                // recursively recall this function itself as the scraping for this persone failed
                counter++;
                if (counter < itemsList.length) {
                    searchPerson(itemsList[counter]);
                } else {
                    finish();
                }
            }


        });
    }

}

function downloadData() {
    console.log('download everything :)')

    let outputName = 'wikidata-people.tsv';

    let headers = []

    d3.selectAll('table thead tr th').each(function(d, i) {
        headers.push(d3.select(this).html());
    })

    // // repository id  number  state created_at  updated_at  closed_at labels
    let tsvtxt = headers.join('\t') + '\n';

    output.forEach(function(o, i) {
        headers.forEach(function(ee, ii) {
            console.log(headers)
            console.log(o)
            tsvtxt += o[ee];
            if (ii < headers.length - 1) {
                tsvtxt += '\t'
            } else {
                tsvtxt += '\n'
            }
        })
    });

    console.log(tsvtxt);

    var blob = new Blob([tsvtxt], {
        type: "data:text/tsv;charset=utf-8"
    });
    saveAs(blob, outputName);
}

function loadSample() {
    document.getElementById('items-list').value = `Italo Calvino\nAbba Giulio Cesare\nAbbagnano Nicola\nAbbas il Grande, scià di Persia\nAbbé Grégoire (Henry Baptiste Grégoire)\nAbbott Edwin Abbott\nAbelardo\nAbernathy Ralph\nAbraham Cresques\nAccrocca Elio Filippo\nAddison Joseph\nAdorno Theodor Wiesengrund\nAfanasjev Aleksandr Nikolaevič\nAgamben Giorgio\nAgostino, santo\nAiolfi Luciano\nAizenberg Roberto\nAlain (Émile Auguste Chartier)\nAlberoni Francesco\nAlberti Leon Battista\nAlbertoni Ettore A.\nAlcmane\nAleramo Sibilla\nAlessandro I, zar\nAlessandro III, zar\nAlfieri Vittorio\nAlgarotti Francesco\nAlighieri Dante\nAllen Woody\nAlmansi Guido\nAltdorfer Albrecht`;
    // document.getElementById('items-list').value = `Italo Calvino\nAlberoni Francesco\nAlberti Leon Battista\nAlessandro III, zar\nAlfieri Vittorio\nAlgarotti Francesco\nAlighieri Dante\nAllen Woody`;
    //
}