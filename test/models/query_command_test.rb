# Unit tests on the QueryCommand class

require 'test_helper'

class MockService
  attr_reader :capture

  def query( query )
    @capture = query.to_json
  end
end

class SearchCommandTest < ActiveSupport::TestCase

  it "constructs a query correctly" do
    service = MockService.new
    sc = mock()
    sc.expects( :from ).returns( Date.new( 2015, 1, 1 ) )
    sc.expects( :to ).returns( Date.new( 2016, 6, 1 ) )
    sc.expects( :region_uri ).returns( "http://fubar.com/foo" )

    qc = QueryCommand.new( sc )
    qc.perform_query( service )

    json = service.capture
    json.wont_be_nil
    json.must_match_json_expression( {
      "@and":
        [
          {"ukhpi:refPeriod":{
            "@ge": {"@value":"2015-01","@type":"http://www.w3.org/2001/XMLSchema#gYearMonth"}
          }},
          {"ukhpi:refPeriod":{
            "@le": {"@value":"2016-06","@type":"http://www.w3.org/2001/XMLSchema#gYearMonth"}
          }},
          {"ukhpi:refRegion":{
            "@eq": {"@id":"http://fubar.com/foo"}
          }}
        ]
    })
  end

  it "uses default dates if not told from and to" do
    service = MockService.new
    sc = mock()
    sc.expects( :from ).returns( nil )
    sc.expects( :to ).returns( nil )
    sc.expects( :region_uri ).returns( "http://fubar.com/foo" )

    qc = QueryCommand.new( sc )
    qc.perform_query( service )

    json = service.capture
    json.wont_be_nil
    json.must_match_json_expression( {
      "@and":
        [
          {"ukhpi:refPeriod":{
            "@ge": {"@value": Time.new( Time.now.year - 1, Time.now.month ).strftime( "%Y-%m" ),
                    "@type":"http://www.w3.org/2001/XMLSchema#gYearMonth"}
          }},
          {"ukhpi:refPeriod":{
            "@le": {"@value": Time.now.strftime( "%Y-%m" ),
                    "@type":"http://www.w3.org/2001/XMLSchema#gYearMonth"}
          }},
          {"ukhpi:refRegion":{
            "@eq": {"@id":"http://fubar.com/foo"}
          }}
        ]
    })
  end
end

