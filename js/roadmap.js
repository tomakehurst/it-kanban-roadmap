var RoadMap = {};

RoadMap.create = function(options) {
	
	var currentDate = moment(options.currentDate);
	var fundingHorizon = moment(options.fundingHorizon);
	var startDate = moment(options.startDate);
	var endDate = moment(options.endDate);
	var programme = options.programme;
	
	function circleLabel(initiative, currentDate) {
		var expectedInPast = moment(initiative.expected).diff(moment(currentDate), 'days') >= 0;
		if (expectedInPast) {
			return "Done";
		} else if (!expectedInPast && initiative.commitment) {
			return "Committed";
		} else {
			return "Forecast";
		}
	}
	
	function half(value) {
		return value / 2;
	}
	
	Processing.prototype.horizontalArrow = function(startX, y, endX) {
		this.strokeWeight(3);
		this.line(startX, y, endX, y);
		this.triangle(endX, y, endX - 15, y - 5, endX - 15, y + 5);
	}
	
	Processing.prototype.verticalBoxTerminatedLine = function(x, startY, endY, label) {
		this.strokeWeight(3);
		this.line(x, startY, x, endY);
		this.rect(x - 5, startY - 5, 10, 10);
		this.rect(x - 5, endY - 5, 10, 10);
		this.text(label, x + 10, startY + 5);
	}
	
	function drawFunctionFor(roadMap) {
		return function(p) {
			var BEFORE_NOW_REGION_COLOUR = p.color(216, 254, 228);
			var NOW_TO_FUNDING_HORIZON_COLOUR = p.color(255, 208, 176);
			var AFTER_FUNDING_HORIZON_COLOUR = p.color(246, 186, 196);
			
			var width = 1500;
			var height = 1000;
			var leftMargin = 200;
			var rightMargin = 50;
			var rightBound = width - rightMargin;
			var topMargin = 50;
			var bottomMargin = 50;
			var bottomBound = height - bottomMargin;
			
			var numMonths = roadMap.numberOfMonths();
			var lineSpacing = (rightBound - leftMargin) / numMonths;
			
			var programmeBoxLeftMargin = 10;
			var programmeBoxTopMargin = topMargin + 50;
			var programmeBoxMidX = programmeBoxLeftMargin + ((leftMargin - programmeBoxLeftMargin) / 2);
			var totalProgrammeHeight = bottomBound - programmeBoxTopMargin;
			var totalProgrammeWidth = rightBound - leftMargin;
			
			var workstreamsLineSpacing = (bottomBound - programmeBoxTopMargin) / _.size(roadMap.workstreams);
			
			var boxSize = 50;
			var circleSize = boxSize * 0.8;
			
			p.background(250);
			p.size(width, height);
			p.strokeWeight(2);
			p.textFont(p.loadFont('arial'), 16);
			p.fill(0);
			p.stroke(200);
			p.line(leftMargin, topMargin, rightBound, topMargin);
			p.line(leftMargin, bottomBound, rightBound, bottomBound);
			
			
			
			//Region colours
			var currentDateLineX = leftMargin + (roadMap.proportionOfRange(currentDate) * (totalProgrammeWidth));
			var fundingHorizonLineX = leftMargin + (roadMap.proportionOfRange(fundingHorizon) * (totalProgrammeWidth));
			
			p.fill(BEFORE_NOW_REGION_COLOUR);
			p.rect(leftMargin, programmeBoxTopMargin, currentDateLineX - leftMargin, bottomBound - programmeBoxTopMargin);
			p.fill(NOW_TO_FUNDING_HORIZON_COLOUR);
			p.rect(currentDateLineX, programmeBoxTopMargin, fundingHorizonLineX - currentDateLineX, bottomBound - programmeBoxTopMargin);
			p.fill(AFTER_FUNDING_HORIZON_COLOUR);
			p.rect(fundingHorizonLineX, programmeBoxTopMargin, rightBound - fundingHorizonLineX, bottomBound - programmeBoxTopMargin);
			p.fill(0);
			
			
			//Vertical lines
			for (var i = 0; i <= numMonths + 1; i++) {
				var x = leftMargin + (i * lineSpacing);
				p.line(x, topMargin, x, bottomBound);
			};
			
			//Month names
			for (i = 0; i < numMonths; i++) {
				var x = leftMargin + 10 + (i * lineSpacing);
				var start = roadMap.startDate.clone();
				var month = start.add('months', i).format('MMM');
				p.text(month, x, topMargin + 30);
			};
			
			p.stroke(0);
			
			//Calculate each workstream's share of total height
			var totalInitiatives = _.reduce(roadMap.workstreams, function(memo, workstream, workstreamName) {
				return memo + workstream.length;
			}, 0);
			var workstreamSpacings = _.reduce(roadMap.workstreams, function(memo, workstream, workstreamName) {
				var height = (workstream.length / totalInitiatives) * totalProgrammeHeight;
				memo[workstreamName] = height;
				return memo;
			}, {});

			//Work stream boxes
			var y = programmeBoxTopMargin;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				y = workstreamSpacings[workstreamName] + y;
				p.line(programmeBoxMidX, y, rightBound, y);
			});
			
			//Programme box
			p.strokeWeight(3);
			p.stroke(0);
			p.noFill();
			p.rect(programmeBoxLeftMargin, programmeBoxTopMargin, rightBound - programmeBoxLeftMargin, bottomBound - programmeBoxTopMargin);
			p.line(programmeBoxMidX, programmeBoxTopMargin, programmeBoxMidX, bottomBound);
			p.line(leftMargin, programmeBoxTopMargin, leftMargin, bottomBound);
			
			p.rotate(p.radians(90));
			p.text(programme, programmeBoxLeftMargin + 300, -20);
			
			//Workstream labels
			var textY = programmeBoxTopMargin + 20;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				p.text(workstreamName, textY, -(programmeBoxMidX + 10));
				textY = textY + workstreamSpacings[workstreamName];
			});
			p.rotate(p.radians(-90));
			
			//Current date and funding horizon lines
			p.fill(0);
			p.verticalBoxTerminatedLine(currentDateLineX, programmeBoxTopMargin - 70, bottomBound + 20, 'Current Date');
			p.verticalBoxTerminatedLine(fundingHorizonLineX, programmeBoxTopMargin - 70, bottomBound + 20, 'Funding Horizon');
			
			//Initiative boxes and circles
			var initiativeSpacing = totalProgrammeHeight / totalInitiatives;
			var i = 0;
			_.each(roadMap.workstreams, function(workstream, workstreamName) {
				_.each(workstream, function(initiative) {
					
					var x = leftMargin + (roadMap.proportionOfRange(initiative.desired) * (totalProgrammeWidth));
				    var y = programmeBoxTopMargin + 30 + (i * initiativeSpacing);
					
					//Label
					p.textFont(p.loadFont('arial'), 17);
					p.fill(0);
					p.text(initiative.name, x, y - 5);
					
					//Box
					p.strokeWeight(2);
					p.stroke(0);
					p.fill(194, 212, 174);
					
					var boxX = x;
					var boxY = y;
					p.rect(boxX, boxY, 50, 50);
					
					//Circle inside box
					p.fill(255);
					p.strokeWeight(1);
					if (initiative.desired !== initiative.expected) {
						p.ellipse(x + half(boxSize), y + half(boxSize), circleSize, circleSize);
					}
					
					//Commitment or forecast circle
					if (initiative.commitment) {
						p.fill(87, 205, 135);
					} else {
						p.fill(255, 155, 88);
					}
					var estimateCircleX = leftMargin + (roadMap.proportionOfRange(initiative.expected) * (totalProgrammeWidth));
					p.ellipse(estimateCircleX + half(boxSize), y + half(boxSize), circleSize, circleSize);
					
					//Commitment/forecast/done label
					p.fill(0);
					p.textFont(p.loadFont('arial'), 9);
					p.text(circleLabel(initiative, '2012-07-01'), estimateCircleX + 7, y + 25);
					
					//Desired -> expected arrow
					if (initiative.desired !== initiative.expected) {
						p.strokeWeight(3);
						if (initiative.commitment) {
							p.stroke(43, 126, 93);
							p.fill(43, 126, 93);
						} else {
							p.stroke(124, 66, 18);
							p.fill(124, 66, 18);
						}
						
						var arrowStartX;
						var arrowEndX;
						if (moment(initiative.expected).diff(moment(initiative.desired), 'days') > 1) {
							arrowStartX = boxX + boxSize;
							arrowEndX = estimateCircleX + 2;
						} else {
							arrowStartX = estimateCircleX + circleSize + 5;
							arrowEndX = boxX - 1;
							
						}
						
						if (arrowEndX - arrowStartX > half(boxSize)) {
							p.horizontalArrow(arrowStartX, boxY + half(boxSize), arrowEndX);
						}
					}
					
					i++;
				});
			});
		}
	}
	
	return {
		startDate: moment(startDate),
		endDate: moment(endDate),
		
		numberOfMonths: function() {
			return this.endDate.diff(this.startDate, 'months');
		},
		
		proportionOfRange: function(dateAsString) {
			var totalDaysInRange = this.endDate.diff(this.startDate, 'days');
			var days = moment(dateAsString).diff(this.startDate, 'days');
			return days / totalDaysInRange;
		},
		
		programme: programme,
		workstreams: [],
		
		drawIn: function(canvas) {
			var p = new Processing(canvas, drawFunctionFor(this));
			p.exit();
		}
	};
};

var thisRoadMap = RoadMap.create({
	programme: 'Test Roadmap',
	currentDate: '2012-03-15',
	fundingHorizon: '2012-09-01',
	startDate: '2012-01-01',
	endDate: '2012-12-31'
});

thisRoadMap.workstreams = {
	"In browser": [{
		name: "Basic grid",
		desired: '2012-01-15',
		expected: "2012-02-14",
		commitment: false
	},
	{
		name: "Programme and workstreams boxes",
		desired: '2012-04-29',
		expected: "2012-04-05",
		commitment: true
	},
	{
		name: "Dots and boxes",
		desired: '2012-07-29',
		expected: "2012-07-29",
		commitment: false
	}],
	
	"Server components": [{
		name: "RESTful persistence API",
		desired: '2012-09-15',
		expected: "2012-10-15",
		commitment: true
	}],
	
	"Screen paint": [{
		name: "Nice colours",
		desired: '2012-11-31',
		expected: "2012-11-27",
		commitment: true
	}]
};


var canvas = document.getElementById("graphics");
thisRoadMap.drawIn(canvas);



var grid;
var columns = [
  {id: "name", name: "Business Initiative", field: "name"},
  {id: "expected", name: "Expected", field: "expected"},
  {id: "commitment", name: "Commitment?", field: "commitment"}
];

var options = {
  enableCellNavigation: true,
  enableColumnReorder: false
};

$(function () {
  var data = [{
      name: "Do the things",
      expected: "01/01/2012",
      commitment: false
    }];
  grid = new Slick.Grid("#dataGrid", data, columns, options);
})