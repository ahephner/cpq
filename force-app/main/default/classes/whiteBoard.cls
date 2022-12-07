public class whiteBoard {
    public static list<OpportunityLineItem> precisionLines(map<string, decimal> items, string pbId, string newOppId){
        List<OpportunityLineItem> itemsBack = new List<OpportunityLineItem>(); 
        Map<string, Decimal> altCodes = new Map<string, Decimal>();
        //find the old code and add replacement to a set
        for(String x :items.keySet()){
            string pc;  
            
            switch on x{
                when 'PL1085-20GL'{
                    pc = 'PL10851-20GL';
                    altCodes.put(pc, items.get(x)); 
                }
                when 'PL1085-2.5GL'{
                    system.debug('2.5'); 
                    pc = 'PL10851-2.5GL';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1082-20GL'{
                    pc = 'PL10821-20GL';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1082-2.5GL'{
                    pc = 'PL10821-2.5GL';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1000-55DR'{
                    pc = 'PL10001-55DR';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1000-2.5GL'{
                    pc = 'PL10001-2.5GL';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1081-2.5GL'{
                    pc = 'PL10811-2.5GL';
                    altCodes.put(pc, items.get(x));
                }
                when 'PL1023-DR'{
                    pc = 'PL10231-DR';
                    altCodes.put(pc, items.get(x));
                }
            }
        }
    
        //make sure it's not empty
        if(!altCodes.isEmpty()){
            //get pricebook options
            list<pricebookentry> presentries = [Select id, ProductCode, product2Id, Level_2_UserView__c,Product_Cost__c,Agency_Product__c, Pricebook2Id, Level_2_Margin__c
                                                  								from pricebookentry where pricebook2id =: pbId and ProductCode in: altCodes.keySet() and 
                                                  								product2.IsActive = true and IsActive = true];
       
            //build the new line items
            for(pricebookentry y: presentries){
                itemsBack.add(
                	new OpportunityLineItem(
                        PricebookEntryId = y.Id,
                        product2id = y.product2Id,
                        quantity = altCodes.get(y.ProductCode),
                        unitprice = y.Level_2_UserView__c,
                        CPQ_Unit_Price__c = y.Level_2_UserView__c,
                        Cost__c = y.Product_Cost__c,
                        CPQ_Margin__c = y.Level_2_Margin__c,
                        OpportunityId = newOppId
                    )
                );
            }
        }
        return itemsBack; 
    }
}