public class cpqOppClone {
    private ApexPages.StandardController controller {get; set;}
    
    private Opportunity opp {get; set;}
    //private Product2 prods {get; set;}
    //set the id of the record that is created --Only used by Test Class
    public ID newOppID {get; set;}
    private string nonActiveItem = '';
    //hard coded for now. Go to workbench run SELECT Id,Name FROM Pricebook2 copy the id of the book needed. 
    private string sportsPriceBookId = '01s17000003ccClAAI';  
    //start the controller
    public cpqOppClone(ApexPages.StandardController controller){
        
        this.controller = controller;
        //grab this record
        opp = (Opportunity)controller.getRecord();
    }
    //action
    public PageReference cloneOpp(){
       
        //Rollback point
        Savepoint sp = Database.setSavepoint();
        //new Opportunity Var
        Opportunity newOp;
        List<OpportunityLineItem> opli = new List<OpportunityLineItem>(); 
       Date cd = System.today() + 14; 
         
        try{
         opp = [SELECT Id, Name, AccountId, CloseDate, Warehouse__c, StageName,  Sales_Rep__r.OwnerId, 
                RecordType.Id, Contact__c, pricebook2.id,Type, description FROM Opportunity where id = :opp.Id]; 
  
            newOp = opp.clone(false);
            
            newOp.Name += ' Cloned';
            newOp.StageName = 'Working(25%)';
            newOp.CloseDate = cd;
            //newOp.Warehouse__c = opp.Warehouse__c;
         //   newOp.CloseDate = cd;  
            insert newOp; 
            system.debug('here new opp -> ' +newOp);
           //test new data
            newOppID = newOp.Id;

			list<Opportunitylineitem> items = cpqCloneHelper(opp.Id, newOppID, opp.Pricebook2Id);              
			
            if(items.size()>0){
                insert items; 
            }
//Look and see if there are any non active items from the old quote            
            List<Opportunitylineitem> nonActiveItems = [SELECT product2.name, unitprice, quantity, CPQ_Margin__c,
                                                   		rate__c, listprice, Description, Per_1_000__c, Per_Acre__c
                                                   		from opportunitylineitem where opportunityid = :opp.Id and PriceBookEntry.IsActive = false]; 
//Turned the @mention to just show Sean due to his request. To turn to a rep see --> {'+opp.Sales_Rep__r.OwnerId+'}             
            if(nonactiveItems.size()>0){
                for(Opportunitylineitem i: nonActiveItems){
                   // system.debug(nonActiveItem);
                    nonActiveItem +='* '+ i.product2.name + '  UNIT PRICE:  $'+ i.UnitPrice +'  QTY: '+ i.Quantity + '\n' +'\n'; 
                }
                ConnectApiHelper.postFeedItemWithMentions(Network.getNetworkId(), newOp.id, '{'+opp.Sales_Rep__r.OwnerId+'} these products are no longer active and were on the old quote '+'\n'+nonActiveItem );
            }
            
        }catch(exception i){
            Database.rollback(sp);
            ApexPages.addMessages(i); 
            return null; 
        }
        return new PageReference('/lightning/r/Opportunity/'+newOp.id+'/view'); 
    }
       
    public static list<OpportunityLineItem> cpqCloneHelper(id OppId, id newOpId, id pbId){
        Map<Id, OpportunityLineItem> prodMap = new Map<Id, OpportunityLineItem>();
        Map<Id, pricebookentry> pbeMap = new Map<Id, pricebookentry>();
        List<opportunitylineitem> newLines = new List<opportunitylineitem>();
         //get opportunity line items that are still have active pricebook entries
            List<OpportunityLineItem> lineItems = [SELECT opportunityid, product2id, unitprice, quantity, CPQ_Margin__c,
                                                   rate__c, listprice, Description, Per_1_000__c, Per_Acre__c, Agency__c
                                                   from opportunitylineitem where opportunityid = :OppId and PriceBookEntry.IsActive = true];
               
        for(OpportunityLineItem x:lineItems){
            prodMap.put(x.product2Id, x);
        }
        
        List<PricebookEntry> pbe = [Select id, product2Id, UnitPrice from pricebookentry where pricebook2id =: pbId and product2Id in: prodMap.keySet()];
        for(pricebookentry x:pbe){
            pbeMap.put(x.product2Id, x);
        }
        
        for(opportunitylineitem ol: lineItems){
           // decimal marg = (ol.UnitPrice/pbeMap.get(ol.Product2Id).UnitPrice)*100;
            //decimal roundMarg = marg.setScale(2, RoundingMode.HALF_UP);
            if(ol.Agency__c == true){
				newLines.add(new OpportunityLineItem(					
                    PricebookEntryId = pbeMap.get(ol.Product2Id).id,
                    product2id = ol.product2id,
                    quantity = ol.quantity,
                    unitprice = pbeMap.get(ol.Product2Id).UnitPrice, 
                    description = ol.description,
                    OpportunityId  = newOpId));                
            }else{
                decimal salesCal = ( pbeMap.get(ol.Product2Id).UnitPrice / (1 - ol.CPQ_Margin__c/100));
                decimal salesPrice = salesCal.setScale(2, RoundingMode.HALF_UP); 
          
                newLines.add(new OpportunityLineItem(					
                    PricebookEntryId = pbeMap.get(ol.Product2Id).id,
                    product2id = ol.product2id,
                    quantity = ol.quantity,
                    unitprice = salesPrice, 
                    CPQ_Margin__c =ol.CPQ_Margin__c,
                    description = ol.description,
                    Per_1_000__c = ol.Per_1_000__c,
                    Per_Acre__c = ol.Per_Acre__c,
                    OpportunityId  = newOpId));                
            }

            //count ++; 
        }
       system.debug(newLines);
        return newLines; 
    }
}