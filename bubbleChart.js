/**
 * Created by Cole on 7/29/15.
 */
/* API Documentation for Bubble Charts */
/* Inputs Required
    svg : val,
    Data Format : [{ key:val , key2:val, ...  } , {key: val , key2: val }]
    xScale : { type: <linear , ordinal , ... > (Default Ordinal for bubble)
    yScale : { type: <linear , ordinal , ... > , values: [ value1 , value2 , ... ] }
    rScale : { type: <linear , ordinal , ... > , values: [ value1 , value2 , ... ] }
    keyMap : { xScale: key , yScale: key2 , rScale: key3 }

    ChartStyles : {
        width : val,
        height : val,
        margin : { left: val , right: val , top: val , bottom: val },
        colors : [ val , val , ... ] || d3 color scale,
        }

    Tooltip : { isEnabled : true ,
            content : [ title: key , title: key2 , ... ],
            Styles : {
                    font-family : val,
                    font-size: val,
                    opacity: val,
                    }
              }
 */


var BubbleChart = function( args ) {
    console.log('Constructor');
   /* Constructor */
    // Define Global Variables for Bubble Chart

    // Separate object
    var tooltip;
    var xAxis;
    var yAxis;

    /*
     * Validate & Set Global Variables to use
     * These are all necessary to make the chart so they will throw errors
     */

    if (args.hasOwnProperty('data')) {
        this.data = args.data;
    } else {
        throw 'No Data Specified for Bubble Chart';
    }

    if (args.hasOwnProperty('xScale')) {
        this.xScale = args.xScale;
    } else {
        throw 'No xAxis Scale Specified for Bubble Chart';
    }
    if (args.hasOwnProperty('yScale')) {
        this.yScale = args.yScale;
    } else {
        throw 'No yAxis Scale Specified for Bubble Chart';
    }
    if (args.hasOwnProperty('rScale')) {
        this.rScale = args.rScale;
    } else {
        throw 'No Radius Scale Specified for Bubble Chart';
    }
    if (args.hasOwnProperty('svg')) {
        this.svg = args.svg;
    } else {
        throw 'No SVG Specified for Bubble Chart';
    }
    if (args.hasOwnProperty('scaleMap')) {
        this.scaleMap = args.scaleMap;
    } else {
        throw 'No ScaleMap Specified for Bubble Chart';
    }

    /* Set Chart Styles */
    this.Styles = {

        // Set Defaults if there are none
        width : args.Styles.width || 500,
        height : args.Styles.height || 500,
        margin : args.Styles.margin || { left:75 , right:20 , top: 20, bottom:20 },
        colors : args.Styles.colors || d3.scale.category20c()
    };

    var scaleMap = this.scaleMap;

    console.log(this.scaleMap.r);

    this.xAxis = new axis( { orientation:'bottom' , type:'ordinal' , range: [ this.Styles.margin.left , this.Styles.width + this.Styles.margin.left ] , domain: this.xScale });
    this.yAxis = new axis( { orientation:'left' , type:'ordinal' , range: [ this.Styles.height , 0 ] , domain: this.yScale } );
    this.rAxis = new axis( { type:'linear' , domain: [0 , d3.max(data , function(d) { return d[ scaleMap['r']]})] , range: this.rScale});

    console.log('Built Axes');
};

BubbleChart.prototype.render = function() {

    var that = this;

    this.svg.attr('height', this.Styles.height + this.Styles.margin.top + this.Styles.margin.bottom)
        .attr('width' , this.Styles.width + this.Styles.margin.left + this.Styles.margin.right);

    this.svg.append('g')
        .attr('class' , 'x axis')
        .attr('transform' , 'translate( ' + this.Styles.margin.right + ',' + this.Styles.height + ')')
        .call( this.xAxis.draw() );

    this.svg.append('g')
        .attr('class' , 'y axis')
        .attr('transform' , 'translate(' + this.Styles.margin.left + ',  0)')
        .call( this.yAxis.draw() );

    this.svg.selectAll('.node')
        .data(this.data)
        .enter()
        .append('circle')
        .attr('class' , 'node')
        .attr('cx' , function(d)  {
            return that.xAxis.scale(d[that.scaleMap.x]) + 75;
        }).attr('cy' , function(d) {
            return that.yAxis.scale(d[that.scaleMap.y]) + 35;
        }).attr('r' , function(d) {
            return that.rAxis.scale(d[that.scaleMap.r]);
        }).attr('fill' , function(d , i) {
            return that.Styles.colors( i );
        });

};


/*
* Defining API for Axis object
* Axis object normally only accessed by chart types
 { orientation: < left , right, top , bottom >
   type: <ordinal , linear>
   styles : {
        font-size: val,
        font-family: val
   }
   range: []
   domain: []
 }

*/

var axis = function ( args ) {

  /* Constructor */
    // No validation, but should be
    this.orientation = args.orientation || 'left';
    this.type = args.type || 'linear';
    this.styles = args.style || {};
    this.domain = args.domain || [];
    this.range = args.range || [];

};

// Returns a d3 scale object
axis.prototype.scale = function( args ) {

    var scaler;
    // No arguments, return scale as a function
        if (this.type == 'linear') {
            scaler = d3.scale.linear()
                .domain(this.domain)
                .range(this.range);
        } else if (this.type == 'ordinal') {
            scaler =  d3.scale.ordinal()
                .domain(this.domain)
                .rangeRoundBands(this.range);
        }
    // if no arguments, return scale as function
    if ( args === undefined ) {
        return scaler;
    } else {
        // Return a scaled value based on the axis scale
        return scaler(args);
    }
};

axis.prototype.draw = function () {
    return d3.svg.axis()
        .scale(this.scale())
        .orient(this.orientation);
};