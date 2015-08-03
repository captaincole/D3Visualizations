/**
 * Created by Cole on 4/14/15.
 */
var forceLinks = [];
var forceData = [];
var color = d3.scale.category20();
var colorScale = 'Decision Power';

colorScheme1 = ['rgb(213 , 62, 62)' , 'rgb(232,192,59)' , 'rgb(61 , 110 , 193)' ];
colorScheme2 = [ '#BC4B05' , '#E1A357' , '#3095B4'];


d3.csv('AmazonExampleforiCharts.csv', function(d) {
    return {
        name: d.Node,
        parent: d.ParentNode,
        color: d.NodeColor,
        level: d.Hierarchy_code,
        business: d.Business_Name,
        power: d.Decisionpower,
        hover: d.HoverOverValue,
        link: d.LinkVALUE
    };
}, function(error, rows) {
    forceData = rows;
    // console.log(rows);
    $.each(forceData, function(i, d) {
        // console.log(d.parent);

        if (d.parent != "" && d.parent !== undefined) {
            forceLinks.push({source: parseInt(d.parent , 10) - 1 , target: parseInt(d.name , 10) - 1, value: parseInt(d.level , 10)});
        }
        // console.log(d);
    });

    initiateChart();
});

function initiateChart() {
    // Initiate Height and With
    var height = 700,
        width = 1200;

    // Setting up brush scale, domain is values, range is px
    var x = d3.scale.linear()
        .domain([1, 10])
        .range([0, 100])
        .clamp(true);

    // Construct brush, call brushed() on every brush event
    var brush = d3.svg.brush()
        .x(x)
        .extent([0,0])
        .on('brush' , brushed);

    // Color scale for Hierarchy color

    // Select and bind svg
    var svg = d3.select('.svg')
        .attr('width', width)
        .attr('height', height);

    // Slider background, ticks, and style
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + 30 + "," + 30 + ")")
        .call(d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(6)
            .tickFormat(function(d) { return d; })
            .tickSize(0)
            .tickPadding(12))
        .select(".domain")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "halo");

    // Construct slider
    var slider = svg.append('g')
        .attr('class', 'slider')
        .call(brush);

     slider.selectAll('.extent, .resize')
       .remove();

    // Add circular handle, place in the same location as the slider
    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(" + 30 + "," + 30 + ")")
        .attr("r", 9);

    // Brush event actions
    slider.call(brush.event)
        .transition()
        .duration(750)
        .call(brush.extent([2, 70]))
        .call(brush.event);


    // When 'brush' is called
    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) {
            // inverse of the mouse position in relation to the slider
            value = x.invert(d3.mouse(this)[0] - 30);
            brush.extent([value, value]);
        }

        handle.attr('cx', x(value));

        // Display only nodes that have a level below inverted value??
        d3.selectAll('.node')
            .attr('display', function(d) {
                if (d.level <= value) {
                    return 'block';
                } else {
                    return 'none';
                }
            });

        // Remove Links with empty targets

        d3.selectAll('.link')
            .attr('display', function(d) {

                if ( $('#' + d.target.name).attr('display') == 'none') {
                    return 'none';
                } else {
                    return 'block';
                }
            });

        // Toggle pulsating nodes to those with invisible children
        togglePulse();

    }

    // Add a Title to the Slider
    svg.append('text')
        .attr('x' , 50)
        .attr('y' , 70)
        .style('font-family' , 'Open Sans')
        .style('font-size' , '12px' )
        .text('Node Depth');

    // Add color change button, as an example of using foreign object inside of an svg
    addButton(svg);

    var force = d3.layout.force()
        .charge(-110)
        .linkDistance(20)
        .size([width, height]);

    force.nodes(forceData)
        .links(forceLinks)
        .start();

    var link = svg.selectAll('.link')
        .data(forceLinks)
        .enter().append('line')
        .attr('class', 'link')
        .attr('display', function (d) {
            if (false) {
                // Start with all links removed
                return 'block';
            } else {
                return 'none';
            }
        })
        .attr('source', function(d) {
            return d.source.name;
        })
        .attr('target' , function (d) {
            return d.target.name;
        })
        .style('stroke-width', function (d) {
            return Math.sqrt(d.value);
        });

    var node = svg.selectAll('.node')
        .data(forceData)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('id', function(d) {
            // Useful for selecting nodes
            return d.name;
        })
        .attr('display', function (d) {
            if (d.parent == "") {
                // Only display the 1st node at the beginning
                return 'block';
            } else {
                return 'none';
            }
        })
        .attr('r', 8)
        .style('fill', function (d) {
            if (colorScale == 'Hierarchy'){
                return color(d.level);
            } else {
                if (d.color == 'RED') {
                    return colorScheme1[0];
                }
                if (d.color == 'YELLOW') {
                    // Slightly Gold / Mustard
                    return colorScheme2[1];
                }
                if (d.color == 'BLUE') {
                    return colorScheme2[2];
                } else {
                    return colorScheme2[2];
                }
            }
        })
        .on('mouseover', function(d , i) {

            if (d3.event.defaultPrevented) {
                return;
            }
            // Create Tooltip
            createTooltip(this , d);
        })
        .on('click', function(d , i) {
            // Stops clicks from happening when dragged
            if (d3.event.defaultPrevented) {
                return;
            }
                // Show / Hide Child nodes
                toggleChildren(d);
                togglePulse();

            d3.select('body').selectAll('.tooltip-custom')
                .remove();

        })
        .on('mouseout', function(d, i) {
            // Remove Tooltip when the user removes the mouse
            d3.select(this).attr('r', 8);
             d3.select('body').selectAll('.tooltip-custom')
                 .remove();
        })
        .on('dblclick', function(d) {
            window.open(d.link , '_blank')
        })
        .call(force.drag);

    //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements

    force.on("tick", function () {
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });
        node.attr("cx", function (d) {
            return d.x = Math.max( 15 , Math.min(width - 15 , d.x) )
        })
            .attr("cy", function (d) {
                return d.y = Math.max( 15 , Math.min(height - 15 , d.y) );
            })

    });

    // Sticky the nodes in a specific location on load
    $('#144').attr('cx' , 600).attr('cy' , 100);
    d3.select('[id="144"]')
        .classed('fixed' , true);

    console.log( $('#144').attr('cx') );


}

// Function to add the toolbox on the left side of the screen
function addButton(svg) {

    var foreignObject = svg.append('foreignObject')
        .attr('width', 300)
        .attr('height', 50)
        .attr('x' , 15)
        .attr('y' , 100);

    var div = foreignObject.append('xhtml:body')
        .append('div')
        .attr('class' , 'onoffswitch');

        div.append('input')
            .attr('type', 'checkbox')
        .attr('name', 'onoffswitch')
        .attr('class', 'onoffswitch-checkbox')
        .attr('id' , 'myonoffswitch')
            .property('checked', true);


         var label = div.append('label')
             .attr('class', 'onoffswitch-label')
             .attr('for', 'myonoffswitch');

             label.append('span')
             .attr('class' , 'onoffswitch-inner');

            label.append('span')
                    .attr('class', 'onoffswitch-switch');

    d3.select('input')
        .on('change', function() {
            toggleColors();
            // togglePulse();
        });

    addLabel();
}

function createTooltip(that, node) {

    d3.select(that).attr('r', 15);

    // Set tooltip styles
    var styles = {
        position: 'absolute',
        top: (d3.event.pageY - 80) + 'px' ,
        left: (d3.event.pageX + 20) + 'px',
        background: 'white',
        'z-index': '10',
        'white-space': 'pre-wrap',
        'border-width': '2px',
        'border-style': 'outset',
        padding: '10px 10px 10px 10px',
        'border-radius': '5px',
        'font-family': 'Open Sans',
        'word-wrap': 'normal'
    };
    var tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip-custom')
        .style(styles);

    var content = node.hover.split('\n');

        tooltip.append('div')
            .attr('class', 'org')
            .text(content[0]);

    if (content.length > 2) {

        tooltip.append('div')
            .attr('class', 'lob')
            .text(content[1]);

        tooltip.append('div')
            .attr('class', 'dp')
            .text(content[2]);
    }

    tooltip.append('div')
        .attr('class', 'link')
        .append('a')
        .attr('padding-top' , '5px')
        .attr('href', '#')
        .text('Double-click node for Hoover Profile');

}

function addLabel() {

    var svg = d3.select('svg');

    var group = svg.append('g').attr('class' , 'label');

    group.append('circle')
        .attr('class', 'labelNode')
        .attr('cx' , 34 )
        .attr('cy' , 160)
        .attr('r' , 8)
        .style('fill' , colorScheme1[0]);

    group.append('text')
        .text('High Decision Power')
        .style('font-family' , 'Open Sans')
        .style('font-size' , '12px')
        .attr('x' , 50)
        .attr('y' , 165);

    group.append('circle')
        .attr('class', 'labelNode')
        .attr('cx' , 34 )
        .attr('cy' , 190)
        .attr('r' , 8)
        .style('fill' , colorScheme2[1]);

    group.append('text')
        .text('Medium Decision Power')
        .style('font-family' , 'Open Sans')
        .style('font-size' , '12px')
        .attr('x' , 50)
        .attr('y' , 195);

    group.append('circle')
        .attr('class', 'labelNode')
        .attr('cx' , 34 )
        .attr('cy' , 220)
        .attr('r' , 8)
        .style('fill' , colorScheme2[2]);

    group.append('text')
        .text('Low Decision Power')
        .style('font-family' , 'Open Sans')
        .style('font-size' , '12px')
        .attr('x' , 50)
        .attr('y' , 225);
}

// Helper function
var hasInvisibleChildren = function(node) {

    var hasProperty = false;
    $.each(forceData, function (i, d) {

        // Find each direct child
        if (d.parent == node.name) {
            // See if children are visible
            var circle = $('#' + d.name).attr('display');
            if (circle == 'none') {
                hasProperty = true;
            }
        }
    });

    return hasProperty;

};

var togglePulse = function() {

    // Using numbers as id's you need an escape charecter \\3 with a space at the end
    // remove the repeating transition for the selected node, doesnt have to be done though.

    d3.selectAll('.node')
        .each( function(d) {
            if (hasInvisibleChildren(d) && $('#' + d.name).attr('display') == 'block') {
                return pulse(this);
            } else {
                return unPulse(this);
            }
        });

    function unPulse(that) {

        // Return to normal by overriding transition
        var circle = d3.select(that)
            .transition(1000)
            .attr('r' , 8);

        // Remove Stroke color
        circle.style('stroke', '#fff')
            .style('stroke-width' , '1px');
    }

    function pulse(that) {
        var circle = d3.select(that);

        // Set stroke color equal the fill color of child nodes
        circle.style('stroke-width' , '1.5px')
             .style('stroke' , function(d) {
                if (colorScale == 'Hierarchy') {
                    return color( parseInt(d.level, 10) + 1 );
                }
                else {
                    return '#636363';
                }
            });

        (function repeat() {

            circle = circle.transition()
                .duration(1000)
                .attr("r", 8)
                .transition()
                .duration(1000)
                .attr("r", 12)
                .ease('linear')
                .each("end", repeat);

        })();

    }
};





// Toggles show/hide for child nodes
var toggleChildren = function(node) {

    d3.selectAll('.node')
        .attr('display', function (d , i) {
            if (d.parent == node.name) {
                // console.log('Parent = ' + d.parent);
                // toggle value
                if (this.getAttribute('display') == 'block') {

                    // Toggle Grand-Child and beyond off
                    removeLegacy(d);
                    return 'none';
                } else {

                    return 'block';
                }
            } else {
                // Don't change the current value
                return $('#' + d.name).attr('display');
            }
        });

    d3.selectAll('.link')
        .attr('display', function(d) {
            // Not sure how d could be undefined, but it is giving errors
            if (d !== undefined) {
                if ($('#' + d.target.name).attr('display') == 'none') {
                    // Toggle link on / off if target is displayed
                    return 'none';
                } else {
                    // Do nothing to links
                    return 'block';
                }
            }
        });

};

var removeLegacy = function(node) {
    d3.selectAll('.node')
        .attr('display', function (d , i) {
            if (d.parent == node.name) {

                // Remove link connecting parent and node
                $('[target=' + d.name +']').attr('display' , 'none');
                removeLegacy(d);
                // Toggle Entire tree off
                return 'none';
            } else {

                // Don't Change the current value
                return $('#'+ d.name).attr('display');
            }
        });
};

var toggleColors = function() {

    var transitions = 0;

    console.log('Toggling Colors');

    if (colorScale == 'Hierarchy') {
        console.log('Decision Power Color Pallate');
        // Switch Color Schemes
        colorScale = 'Decision Power';

        d3.selectAll('.node')
            .transition()
            .duration(500)
            .style('fill', function(d) {
                if (d.color == 'RED') {
                    return colorScheme1[0];
                } if (d.color == 'YELLOW') {
                    // Slightly Gold / Mustard
                    return colorScheme2[1];
                } if (d.color == 'BLUE') {
                    return colorScheme2[2];
                } else {
                    return 'orange';
                }
            }).each('start' , function() { transitions++ })
            .each('end' , function() {
                if (--transitions === 0) {
                    // Chained transition happens only when all nodes are done, only called once
                    togglePulse();
                }
            });



    } else {

        // Fill by Depth
        colorScale = 'Hierarchy';
        d3.select('svg').selectAll('.node')
            .transition()
            .duration(500)
            .style('fill', function (d) {
                 return color(d.level);
            }).each('start' , function() { transitions++ })
            .each('end' , function() {
                if (--transitions === 0) {
                    togglePulse();
                }
            });


    }

    // After toggling colors, remove label
    if ( colorScale == 'Hierarchy') {
        d3.select('.label').remove();
    } else {
        addLabel();
    }

};




